# Initial Structure — FastAPI + SQLAlchemy + Pydantic

Estructura base de un proyecto en capas (routers, services, repositories, models, schemas, dtos, mappers, middlewares).

## Importante: este repo es un TEMPLATE

**No clones este repo directamente ni intentes pushear.** El repo está protegido y solo el docente tiene permisos de escritura.

### Cómo trabajar con esta plantilla

1. Entrá al repo en GitHub.
2. Hacé click en el botón verde **"Use this template" → "Create a new repository"** (o, si no aparece, usá **"Fork"**).
3. Creá el nuevo repo en **tu cuenta personal** de GitHub.
4. Cloná **tu copia** (no la del docente):
   ```bash
   git clone https://github.com/<TU_USUARIO>/<TU_REPO>.git
   cd <TU_REPO>
   ```
5. A partir de ahí trabajás libremente sobre tu propio repo.

> Si intentás `git push` y te dice `permission denied`, es porque clonaste el repo del docente en lugar de tu fork/template. Volvé al paso 2.

---

## Setup

```bash
python -m venv venv
source venv/bin/activate          # Linux/Mac
# venv\Scripts\activate            # Windows

pip install -r requirements.txt
cp .env.example .env               # editá con tus credenciales

uvicorn src.main:app --reload
```

Abrir http://localhost:8000/docs para ver Swagger.

---

## Estructura de carpetas

```
src/
├── db/
│   ├── connection.py
│   ├── models/          # SQLAlchemy
│   ├── migrations/      # Alembic
│   └── seeders/
├── schemas/             # Pydantic (validación HTTP)
├── dtos/                # Pydantic (transporte entre capas)
├── mappers/             # Model ⇄ DTO
├── repositories/        # queries
├── services/            # lógica de negocio
├── routers/             # endpoints FastAPI
├── middlewares/
├── config/
├── utils/
├── app.py               # crea app FastAPI
└── main.py              # entry point
```

---

## Cómo está pensada la entrega

El módulo de **users** tiene un endpoint completo (`POST /users`) con todas las capas implementadas como ejemplo de la sintaxis.

El resto de los métodos (`GET`, `PUT`, `DELETE`) y los demás dominios (`products`, `auth`) están con `...` / `pass` / comentarios `TODO`. **Tu trabajo es completarlos** siguiendo el patrón del ejemplo.

---

## Reglas de la arquitectura

1. `routers` no tocan la BD.
2. `services` no tocan `Request` / `Response`.
3. `repositories` no tienen lógica de negocio.
4. `models` no salen del repository / service.
5. `schemas` solo en routers.
6. Al cliente siempre va un DTO, nunca un Model.
