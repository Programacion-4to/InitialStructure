-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "xp_total" INTEGER NOT NULL DEFAULT 0,
    "racha_dias" INTEGER NOT NULL DEFAULT 0,
    "fecha_ultima_actividad" TIMESTAMP(3),
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idiomas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idiomas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cursos" (
    "id" TEXT NOT NULL,
    "idioma_id" TEXT NOT NULL,
    "nivel" "NivelCurso" NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cursos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecciones" (
    "id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "titulo" TEXT NOT NULL,
    "xp_recompensa" INTEGER NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "progresos" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "leccion_id" TEXT NOT NULL,
    "puntaje" INTEGER NOT NULL DEFAULT 0,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_completada" TIMESTAMP(3),

    CONSTRAINT "progresos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insignias" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "criterio" TEXT NOT NULL,
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insignias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuario_cursos" (
    "usuario_id" TEXT NOT NULL,
    "curso_id" TEXT NOT NULL,
    "fecha_inscripcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_cursos_pkey" PRIMARY KEY ("usuario_id","curso_id")
);

-- CreateTable
CREATE TABLE "usuario_insignias" (
    "usuario_id" TEXT NOT NULL,
    "insignia_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_insignias_pkey" PRIMARY KEY ("usuario_id","insignia_id")
);

-- CreateTable
CREATE TABLE "amistades" (
    "usuario_a_id" TEXT NOT NULL,
    "usuario_b_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "amistades_pkey" PRIMARY KEY ("usuario_a_id","usuario_b_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "idiomas_nombre_key" ON "idiomas"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "idiomas_codigo_key" ON "idiomas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "lecciones_curso_id_orden_key" ON "lecciones"("curso_id", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "progresos_usuario_id_leccion_id_key" ON "progresos"("usuario_id", "leccion_id");

-- CreateIndex
CREATE UNIQUE INDEX "insignias_nombre_key" ON "insignias"("nombre");

-- AddForeignKey
ALTER TABLE "cursos" ADD CONSTRAINT "cursos_idioma_id_fkey" FOREIGN KEY ("idioma_id") REFERENCES "idiomas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecciones" ADD CONSTRAINT "lecciones_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progresos" ADD CONSTRAINT "progresos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "progresos" ADD CONSTRAINT "progresos_leccion_id_fkey" FOREIGN KEY ("leccion_id") REFERENCES "lecciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_cursos" ADD CONSTRAINT "usuario_cursos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_cursos" ADD CONSTRAINT "usuario_cursos_curso_id_fkey" FOREIGN KEY ("curso_id") REFERENCES "cursos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_insignias" ADD CONSTRAINT "usuario_insignias_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario_insignias" ADD CONSTRAINT "usuario_insignias_insignia_id_fkey" FOREIGN KEY ("insignia_id") REFERENCES "insignias"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amistades" ADD CONSTRAINT "amistades_usuario_a_id_fkey" FOREIGN KEY ("usuario_a_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amistades" ADD CONSTRAINT "amistades_usuario_b_id_fkey" FOREIGN KEY ("usuario_b_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
