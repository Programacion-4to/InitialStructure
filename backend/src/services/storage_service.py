from dataclasses import dataclass
from pathlib import Path
from typing import BinaryIO, Iterator
from uuid import uuid4
import re

import boto3
from botocore.client import Config
from botocore.exceptions import ClientError

from src.config.env import settings
from src.utils import ConflictError


@dataclass
class StorageFileUploadResult:
    object_key: str
    mime_type: str | None
    size: int | None


@dataclass
class StorageStreamResult:
    status_code: int
    headers: dict[str, str]
    chunks: Iterator[bytes]


class StorageService:
    def __init__(self):
        self.bucket_name = settings.S3_BUCKET_NAME
        self.client = boto3.client(
            "s3",
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY,
            region_name=settings.S3_REGION,
            config=Config(signature_version="s3v4"),
        )
        self._ensure_bucket()

    def create_folder(self, name: str, parent_folder_id: str | None = None) -> str:
        prefix = parent_folder_id.strip("/") if parent_folder_id else settings.S3_MEDIA_PREFIX.strip("/")
        folder_name = f"{self._safe_name(name)}-{uuid4().hex[:8]}"
        return f"{prefix}/{folder_name}".strip("/")

    def upload_video(
        self,
        file: BinaryIO,
        filename: str,
        mime_type: str,
        parent_folder_id: str,
    ) -> StorageFileUploadResult:
        safe_filename = f"{uuid4().hex[:8]}-{self._safe_name(filename)}"
        object_key = f"{parent_folder_id.strip('/')}/{safe_filename}".strip("/")

        file.seek(0)
        self.client.upload_fileobj(
            file,
            self.bucket_name,
            object_key,
            ExtraArgs={"ContentType": mime_type},
        )
        metadata = self.client.head_object(Bucket=self.bucket_name, Key=object_key)

        return StorageFileUploadResult(
            object_key=object_key,
            mime_type=metadata.get("ContentType") or mime_type,
            size=metadata.get("ContentLength"),
        )

    def stream_file(
        self,
        object_key: str,
        range_header: str | None = None,
        fallback_mime_type: str = "video/mp4",
    ) -> StorageStreamResult:
        params = {"Bucket": self.bucket_name, "Key": object_key}
        if range_header:
            params["Range"] = range_header

        try:
            response = self.client.get_object(**params)
        except ClientError as error:
            status_code = error.response.get("ResponseMetadata", {}).get("HTTPStatusCode")
            if status_code == 404:
                raise ConflictError("No se encontro el archivo en el storage")
            raise ConflictError("No se pudo obtener el archivo desde el storage")

        body = response["Body"]
        status_code = response.get("ResponseMetadata", {}).get("HTTPStatusCode", 200)
        headers = {
            "Accept-Ranges": response.get("AcceptRanges", "bytes"),
            "Content-Type": response.get("ContentType", fallback_mime_type),
            "Content-Length": str(response.get("ContentLength", "")),
        }
        content_range = response.get("ContentRange")
        if content_range:
            headers["Content-Range"] = content_range
            status_code = 206

        def iter_chunks():
            try:
                while True:
                    chunk = body.read(1024 * 1024)
                    if not chunk:
                        break
                    yield chunk
            finally:
                body.close()

        return StorageStreamResult(
            status_code=status_code,
            headers={key: value for key, value in headers.items() if value},
            chunks=iter_chunks(),
        )

    def _ensure_bucket(self) -> None:
        try:
            self.client.head_bucket(Bucket=self.bucket_name)
        except ClientError:
            self.client.create_bucket(Bucket=self.bucket_name)

    def _safe_name(self, value: str) -> str:
        value = Path(value).name.strip()
        value = re.sub(r"[^a-zA-Z0-9._ -]+", "", value)
        value = re.sub(r"\s+", "-", value)
        return value or "archivo"
