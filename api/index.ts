import { Hono } from 'hono'

const METABASE_URL = process.env.METABASE_URL;

const app = new Hono()

app.get('/api/health', async c => {
    c.status(200);
    return c.json({ status: 'ok' });
});

app.get('/api/setup/admin_checklist', async (c) => {
    // Pass through the admin checklist from the frontend to the backend
    const admin_checklist_call = await fetch(`${METABASE_URL}/api/setup/admin_checklist`, {
        method: 'GET',
        headers: {
            'Cookie': c.req.header('Cookie')
        }
    });
    const admin_checklist_call_json = await admin_checklist_call.json();

    // If the backend responds with an error, pass that through to the frontend
    if (admin_checklist_call.status !== 200) {
        c.status(admin_checklist_call.status);
        return c.json(admin_checklist_call_json.message);
    }
    console.log('Admin checklist call', admin_checklist_call_json);
    return c.json(admin_checklist_call_json);

})

app.get('/api/database', async (c) => {
    // Pass through the database creation from the frontend to the backend
    const db_call = await fetch(`${METABASE_URL}/api/database`, {
        method: 'GET',
        headers: {
            'Cookie': c.req.header('Cookie')
        }
    });
    const db_call_json = await db_call.json();

    // If the backend responds with an error, pass that through to the frontend
    if (db_call.status !== 200) {
        c.status(db_call.status);
        return c.json(db_call_json.message);
    }
    console.log('Database call', db_call_json);

    return c.json(db_call_json);
})

app.post('/api/database', async (c) => {
    // Get the permission graph first, in order to get the revision and use it later
    const permission_graph = await fetch(`${METABASE_URL}/api/permissions/graph`, {
        headers: {
            'Cookie': c.req.header('Cookie')
        }
    });
    let permission_graph_json = await permission_graph.json();

    // Pass through the database creation from the frontend to the backend
    const db_call = await fetch(`${METABASE_URL}/api/database`, {
        method: 'POST',
        body: JSON.stringify(await c.req.json()),
        headers: {
            'Cookie': c.req.header('Cookie'),
            'Content-Type': 'application/json'
        }
    });
    const db_call_json = await db_call.json();
    
    // If the backend responds with an error, pass that through to the frontend
    if (db_call.status !== 200) {
        c.status(db_call.status);
        return c.json(db_call_json.message);
    }

    // Grab the ID of the database we just created, in order to remove permissions later
    const db_id = db_call_json.id;

    // Build a payload to set "No self service" permissions to the "All users" group. This payload is reduced to the bare minimum so the backend gets the minimum amount of data to process
    let new_permission_graph = {
        revision: permission_graph_json.revision,
        groups: {
            "1": {
                [db_id]: {
                    data: {
                        native:"none",
                        schemas:"none"
                    }
                }
            }
        },
    }

    // Set the permissions on the newly created database
    let permissions_call = await fetch(`${METABASE_URL}/api/permissions/graph`, {
        method: 'PUT',
        body: JSON.stringify(new_permission_graph),
        headers: {
            'Cookie': c.req.header('Cookie'),
            'Content-Type': 'application/json'
        }
    });

    // This while here is used for retrying the PUT request in case the revision is outdated, which might happen 
    // if there are many users at the same time creating databases or if there is any permissions change between the first call and the call above
    // In this case, we indiscriminately increment the revision and try again and again until the backend accepts the request, as we need to minimize the probability of someone seeing a database they shouldn't
    while (permissions_call.status !== 200) {
        new_permission_graph.revision++;
        permissions_call = await fetch(`${METABASE_URL}/api/permissions/graph`, {
            method: 'PUT',
            body: JSON.stringify(new_permission_graph),
            headers: {
                'Cookie': c.req.header('Cookie'),
                'Content-Type': 'application/json'
            }
        }); 
    }
    // Finally we respond to the frontend with the response from the POST to the databases call from the backend
    return c.json(db_call_json);
});

export default {
    port: 3000,
    fetch: app.fetch,
}