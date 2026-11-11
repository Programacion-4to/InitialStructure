## Como arrancar el proyecto

Lo primero que deben saber es que el proyecto tiene 2 partes. Un fronted y un backend.

El proyecto debe tener un diferencial/valor agregado DISTINTO a la aplicacion/web elegida.
Este diferencial debe utilizar el core/nucleo (lo que la hace que tenga sentido que exista) y debe estar validado por el profesor (YO)

## Frontend

Es la parte que interactua el usuario. Aca tenemos el diseño de aplicacion.

### Como arranco con el frontend?

1) Elegir cualquier IA generativa para realizar las pantallas, flujo de la aplicacion y diseño. Opciones recomendadas:
- Lovable
- FigmaMake
- V0
- Otra IA como Codex (ChatGPT) o Claude

2) Realizar un prompt a esta IA seleccionada para que realice el frontend. Ejemplo de prompt:
```
[Pegan la consigna (TODO el archivo con las HU, tablas, etc.)]
[Diferencial que tienen]
Realizame el frontend de esta aplicacion utilizando TypeScript y dejame comentados los endpoints de la app ya que ya tengo mi propio backend.
```

Aclaracion: El diseño elegido no puede ser una copia exacta de la app

3) Una vez que esta el proyecto hecho por la IA elegida, exportarlo a github, copiar su codigo y pegarlo en la carpeta que dice `/frontend` (Borrar todo lo que tiene antes)

4) Levantar el frontend utilizando (lo mas problable) `bun`. Aclaracion: cuando ya tengan el frontend, revisen el archivo `README.md` del proyecto de frontend que les hizo la IA para ver como levantarlo

## Backend

## Como arranco con el backend?

### Tablas y Base de Datos (pgAdmin)

1) Miro la consigna de mi proyecto y me fijo que entidades tengo, de ahi ya se que tablas voy a tener que crear

2) Creo las tablas a mano o con alguna IA para apurar (pasarle TODA la consigna)

3) Abro pgAdmin y creo una base de datos con el nombre del proyecto

4) Abro la terminal del pgAdmin para ejecutar una query. Ahi pego el archivo con todas las tablas y lo ejecuto 1 sola vez (si es que no fallo)

5) Una vez que tenemos la base creada, vamos al VisualStudio, abro `/src/db/tables.sql` y pego el .sql con las tablas que acabo de crear

### Codigo (VisualStudio)

Como ya tenemos la base creada, arrancamos con el proyecto (estructura del proyecto: https://github.com/Programacion-4to/2026/blob/main/U3%3A%20Bases%20de%20datos%2C%20SQL%2C%20Model%20y%20Schemas/Estructura%20de%20Proyecto.md)


Antes de que se manden a hacer de todo, arranquen con estos pasos pero solo para 1 tabla/entidad, luego hacen el resto una vez que no les haya fallado nada

1) Models: arranco a pasar la tabla del .sql que tenia antes a un Model dentro de `/src/db/models/`. Creo el archivo siguiendo los nombres dados, copio y pego lo de algun otro archivo para usarlo como base y edito los cambios necesarios para modelar mi tabla/entidad

2) DTO: lo mismo copio, pego y edito segun lo que necesite

3) Mappers: lo mismo copio, pego y edito (no solo codigo sino NOMBRES) lo que necesite. Requisitos: model y DTO

4) Repositories: lo mismo copio, pego y edito (no solo codigo sino NOMBRES) lo que necesite. Requisitos: model

5) Schema: lo mismo copio, pego y edito (no solo codigo sino NOMBRES) lo que necesite.

6) Service: lo mismo copio, pego y edito (no solo codigo sino NOMBRES) lo que necesite. Requisitos: DTO y Repositories

7) Router: lo mismo copio, pego y edito (no solo codigo sino NOMBRES) lo que necesite. Requisitos: Model, DTOs, Schema, Service

8) Vamos a `app.py` y añadimos el router a la API

9) Sigo los pasos de los comandos que hay en `/backend/README.md` para levantar la API

10) Abrir `http://localhost:8000/docs` y probar la API



## Documentacion

Secciones que debe tener: 
- el README.md del proyecto, 
- la documentacion de la API (Swagger)
- la documentacion de la base de datos (pgAdmin)

1) Readme.md: debe contener pantallas/secciones del frontend y que se puede realizar en cada una, explicacion del diferencial y explicacion de algun algoritmo que hayan hecho (ejemplo recomendacion de peliculas, busqueda de productos, etc.) y como funciona. Con que realizaron el frontend. Separacion de carpetas y explicacion de que hace cada una. Que tecnologias utilizaron y porque. Que problemas tuvieron y como los resolvieron. Que aprendieron y que les gustaria aprender. Al final dejar quien hizo que y que se llevo de la materia.

2) Documentacion de la API: debe contener todos los endpoints, que hacen, que parametros reciben y que devuelven. Esto lo hace automaticamente FastAPI con Swagger (http://localhost:8000/docs)

3) Documentacion de la base de datos: debe contener todas las tablas, que columnas tienen, que relaciones tienen y que datos se pueden guardar en cada columna. Esto lo hace automaticamente pgAdmin (https://www.pgadmin.org/)