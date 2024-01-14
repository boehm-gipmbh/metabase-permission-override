# Override a specific Metabase API method

This project shows how to override a specific Metabase API call from the frontend

```
                                                                             
    +-------------+             +-------------+             +-------------+  
    |             |             |             |             |             | 
    |    User     |- - - - - - >|    Nginx    |- - - - - - >|  Metabase   |   
    |             |             |             |             |             | 
    +-------------+             +-------------+             +-------------+  
                                      |                            ^
                                      |                            |
                                      |                            |
                               +---------------+                   |
                               |     API       |                   |
                               |     POST      |- - - - - - - - - - 
                               | /api/database |
                               +---------------+

```

## Problem

Metabase adds all databases with unrestricted permissions, in case someone wants to add a database with "No self service" permissions, you need to explicitly do that in the permissions section

## Workaround

Build an API that will act as a sidecar to the Metabase APIs, capturing specifically the call to the database endpoint when someone adds a database (POST /api/database) and then calling the permissions endpoint to remove the "Unrestricted" permissions after the database has been added.

Nginx is set up in a way to redirect the POST calls to the database endpoint to an API that runs in a container. This API is in charge of the custom logic.

## How to test

1) install Docker
2) clone this repo
3) run `docker compose up` on the root folder
4) wait till nginx is up and then go to `http://localhost:8080`
5) Add a database (there's one on the hostname postgres, username metabase, password metasample123, database sample that's also in the docker compose stack you just raised)
6) check the permissions section
