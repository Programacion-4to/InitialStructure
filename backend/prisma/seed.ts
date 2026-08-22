import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.usuarioInsignia.deleteMany({})
  await prisma.amistad.deleteMany({})
  await prisma.progreso.deleteMany({})
  await prisma.usuarioCurso.deleteMany({})
  await prisma.leccion.deleteMany({})
  await prisma.curso.deleteMany({})
  await prisma.insignia.deleteMany({})
  await prisma.idioma.deleteMany({})
  await prisma.usuario.deleteMany({})

  const idioma = await prisma.idioma.create({
    data: {
      nombre: 'Inglés',
      codigo: 'en'
    }
  })

  const curso = await prisma.curso.create({
    data: {
      idiomaId: idioma.id,
      nivel: 'A1'
    }
  })

  const lecciones = await prisma.leccion.createMany({
    data: [
      { cursoId: curso.id, orden: 1, titulo: 'Alphabet Basics', xpRecompensa: 10 },
      { cursoId: curso.id, orden: 2, titulo: 'Greetings', xpRecompensa: 15 },
      { cursoId: curso.id, orden: 3, titulo: 'Daily Questions', xpRecompensa: 20 }
    ]
  })

  const usuario1 = await prisma.usuario.create({
    data: {
      email: 'ana@duolingo.local',
      nombre: 'Ana',
      xpTotal: 100,
      rachaDias: 4
    }
  })

  const usuario2 = await prisma.usuario.create({
    data: {
      email: 'julio@duolingo.local',
      nombre: 'Julio',
      xpTotal: 60,
      rachaDias: 2
    }
  })

  const usuario3 = await prisma.usuario.create({
    data: {
      email: 'maria@duolingo.local',
      nombre: 'Maria',
      xpTotal: 30,
      rachaDias: 1
    }
  })

  await prisma.usuarioCurso.createMany({
    data: [
      { usuarioId: usuario1.id, cursoId: curso.id },
      { usuarioId: usuario2.id, cursoId: curso.id },
      { usuarioId: usuario3.id, cursoId: curso.id }
    ]
  })

  const insigniaXP = await prisma.insignia.create({
    data: {
      nombre: 'Primera XP',
      descripcion: 'Gana al menos 100 XP',
      criterio: 'xp>=100'
    }
  })

  const insigniaRacha = await prisma.insignia.create({
    data: {
      nombre: 'Racha corta',
      descripcion: 'Mantén una racha de 7 días',
      criterio: 'racha>=7'
    }
  })

  await prisma.usuarioInsignia.create({
    data: {
      usuarioId: usuario1.id,
      insigniaId: insigniaXP.id
    }
  })

  await prisma.amistad.createMany({
    data: [
      { usuarioAId: usuario1.id, usuarioBId: usuario2.id },
      { usuarioAId: usuario1.id, usuarioBId: usuario3.id }
    ]
  })

  console.log('Seed de ejemplo cargado')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
