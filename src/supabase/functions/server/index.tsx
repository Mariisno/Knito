import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import * as kv from './kv_store.tsx';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const app = new Hono();

app.use('*', logger(console.log));
app.use('*', cors());

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Create storage bucket on startup
const bucketName = 'make-b06c9f7a-knitting-images';
async function initStorage() {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
    if (!bucketExists) {
      console.log('Creating storage bucket:', bucketName);
      await supabaseAdmin.storage.createBucket(bucketName, { public: false });
    }
  } catch (error) {
    console.log('Error initializing storage:', error);
  }
}
initStorage();

// Helper function to verify user from access token
async function getUserFromToken(c: any) {
  const userToken = c.req.header('X-User-Token');
  
  if (!userToken) {
    console.log('No X-User-Token header');
    return null;
  }
  
  try {
    // Parse JWT token manually to extract user ID
    // JWT format: header.payload.signature
    const parts = userToken.split('.');
    if (parts.length !== 3) {
      console.log('Invalid JWT format - not 3 parts');
      return null;
    }
    
    // Decode the payload (second part)
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    console.log('JWT payload sub (user ID):', payload.sub);
    
    if (!payload.sub) {
      console.log('No sub (user ID) in JWT payload');
      return null;
    }
    
    // Verify the token is not expired
    if (payload.exp && payload.exp < Date.now() / 1000) {
      console.log('JWT token has expired');
      return null;
    }
    
    return payload.sub;
  } catch (error) {
    console.log('Exception in getUserFromToken:', error);
    return null;
  }
}

// Sign up
app.post('/make-server-b06c9f7a/auth/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log('Error creating user during signup:', error);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.log('Error in signup route:', error);
    return c.json({ error: 'Failed to create account' }, 500);
  }
});

// Get all projects for a user
app.get('/make-server-b06c9f7a/projects', async (c) => {
  try {
    console.log('GET /projects - X-User-Token:', c.req.header('X-User-Token')?.substring(0, 30) + '...');
    
    const userId = await getUserFromToken(c);
    if (!userId) {
      console.log('GET /projects - No userId, returning 401');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('GET /projects - userId:', userId);
    const projects = await kv.getByPrefix(`project:${userId}:`);
    return c.json({ projects });
  } catch (error) {
    console.log('Error fetching projects:', error);
    return c.json({ error: 'Failed to fetch projects' }, 500);
  }
});

// Get a single project
app.get('/make-server-b06c9f7a/projects/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const project = await kv.get(`project:${userId}:${id}`);
    
    if (!project) {
      return c.json({ error: 'Project not found' }, 404);
    }
    
    return c.json({ project });
  } catch (error) {
    console.log('Error fetching project:', error);
    return c.json({ error: 'Failed to fetch project' }, 500);
  }
});

// Create a new project
app.post('/make-server-b06c9f7a/projects', async (c) => {
  try {
    console.log('POST /projects - Starting project creation...');
    
    const userId = await getUserFromToken(c);
    if (!userId) {
      console.log('POST /projects - No userId, returning 401');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const project = await c.req.json();
    console.log('POST /projects - Received project:', JSON.stringify(project, null, 2));
    
    if (!project.id || !project.name) {
      console.log('POST /projects - Missing id or name');
      return c.json({ error: 'Project must have id and name' }, 400);
    }
    
    const key = `project:${userId}:${project.id}`;
    console.log('POST /projects - Saving to key:', key);
    
    await kv.set(key, project);
    console.log('POST /projects - Project saved successfully');
    
    return c.json({ project });
  } catch (error) {
    console.log('Error creating project:', error);
    return c.json({ error: 'Failed to create project' }, 500);
  }
});

// Update a project
app.put('/make-server-b06c9f7a/projects/:id', async (c) => {
  try {
    console.log('PUT /projects/:id - Starting project update...');
    
    const userId = await getUserFromToken(c);
    if (!userId) {
      console.log('PUT /projects/:id - No userId, returning 401');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const updates = await c.req.json();
    console.log('PUT /projects/:id - Project ID:', id);
    console.log('PUT /projects/:id - Updates:', JSON.stringify(updates, null, 2));
    
    const key = `project:${userId}:${id}`;
    const existing = await kv.get(key);
    
    if (!existing) {
      console.log('PUT /projects/:id - Project not found at key:', key);
      return c.json({ error: 'Project not found' }, 404);
    }
    
    console.log('PUT /projects/:id - Existing project:', JSON.stringify(existing, null, 2));
    
    const updated = { ...existing, ...updates };
    await kv.set(key, updated);
    console.log('PUT /projects/:id - Project updated successfully');
    
    return c.json({ project: updated });
  } catch (error) {
    console.log('Error updating project:', error);
    return c.json({ error: 'Failed to update project' }, 500);
  }
});

// Delete a project
app.delete('/make-server-b06c9f7a/projects/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    
    const existing = await kv.get(`project:${userId}:${id}`);
    if (!existing) {
      return c.json({ error: 'Project not found' }, 404);
    }
    
    await kv.del(`project:${userId}:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting project:', error);
    return c.json({ error: 'Failed to delete project' }, 500);
  }
});

// Upload image
app.post('/make-server-b06c9f7a/upload-image', async (c) => {
  try {
    const userId = await getUserFromToken(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

    // Upload to Supabase Storage
    const arrayBuffer = await file.arrayBuffer();
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, arrayBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.log('Error uploading file to storage:', error);
      return c.json({ error: 'Failed to upload image' }, 500);
    }

    // Create signed URL (valid for 10 years)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUrl(fileName, 60 * 60 * 24 * 365 * 10);

    if (signedUrlError) {
      console.log('Error creating signed URL:', signedUrlError);
      return c.json({ error: 'Failed to create signed URL' }, 500);
    }

    return c.json({ url: signedUrlData.signedUrl, path: fileName });
  } catch (error) {
    console.log('Error in upload-image route:', error);
    return c.json({ error: 'Failed to upload image' }, 500);
  }
});

// Get standalone yarns for a user
app.get('/make-server-b06c9f7a/standalone-yarns', async (c) => {
  try {
    console.log('GET /standalone-yarns - X-User-Token:', c.req.header('X-User-Token')?.substring(0, 30) + '...');
    
    const userId = await getUserFromToken(c);
    if (!userId) {
      console.log('GET /standalone-yarns - No userId, returning 401');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    console.log('GET /standalone-yarns - userId:', userId);
    const yarns = await kv.get(`standalone-yarns:${userId}`) || [];
    return c.json({ yarns });
  } catch (error) {
    console.log('Error fetching standalone yarns:', error);
    return c.json({ error: 'Failed to fetch standalone yarns' }, 500);
  }
});

// Update standalone yarns for a user
app.put('/make-server-b06c9f7a/standalone-yarns', async (c) => {
  try {
    const userId = await getUserFromToken(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { yarns } = await c.req.json();
    await kv.set(`standalone-yarns:${userId}`, yarns);
    
    return c.json({ yarns });
  } catch (error) {
    console.log('Error updating standalone yarns:', error);
    return c.json({ error: 'Failed to update standalone yarns' }, 500);
  }
});

Deno.serve(app.fetch);