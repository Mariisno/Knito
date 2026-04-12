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
      await supabaseAdmin.storage.createBucket(bucketName, { public: false });
    }
  } catch (error) {
    console.error('Error initializing storage:', error);
  }
}
initStorage();

// Verify user from access token using Supabase's signature verification
async function getUserFromToken(c: any) {
  const userToken = c.req.header('X-User-Token');

  if (!userToken) {
    return null;
  }

  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(userToken);
    if (error || !user) return null;
    return user.id;
  } catch {
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
      return c.json({ error: error.message }, 400);
    }

    return c.json({ user: data.user });
  } catch (error) {
    console.error('Error in signup route:', error);
    return c.json({ error: 'Failed to create account' }, 500);
  }
});

// Get all projects for a user
app.get('/make-server-b06c9f7a/projects', async (c) => {
  try {
    const userId = await getUserFromToken(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const projects = await kv.getByPrefix(`project:${userId}:`);
    return c.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
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
    console.error('Error fetching project:', error);
    return c.json({ error: 'Failed to fetch project' }, 500);
  }
});

// Create a new project
app.post('/make-server-b06c9f7a/projects', async (c) => {
  try {
    const userId = await getUserFromToken(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const project = await c.req.json();

    if (!project.id || !project.name) {
      return c.json({ error: 'Project must have id and name' }, 400);
    }

    const key = `project:${userId}:${project.id}`;
    await kv.set(key, project);

    return c.json({ project });
  } catch (error) {
    console.error('Error creating project:', error);
    return c.json({ error: 'Failed to create project' }, 500);
  }
});

// Update a project
app.put('/make-server-b06c9f7a/projects/:id', async (c) => {
  try {
    const userId = await getUserFromToken(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const id = c.req.param('id');
    const updates = await c.req.json();

    const key = `project:${userId}:${id}`;
    const existing = await kv.get(key);

    if (!existing) {
      return c.json({ error: 'Project not found' }, 404);
    }

    const updated = { ...existing, ...updates };
    await kv.set(key, updated);

    return c.json({ project: updated });
  } catch (error) {
    console.error('Error updating project:', error);
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
    console.error('Error deleting project:', error);
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
      return c.json({ error: 'Failed to upload image' }, 500);
    }

    // Create signed URL (valid for 10 years)
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from(bucketName)
      .createSignedUrl(fileName, 60 * 60 * 24 * 365 * 10);

    if (signedUrlError) {
      return c.json({ error: 'Failed to create signed URL' }, 500);
    }

    return c.json({ url: signedUrlData.signedUrl, path: fileName });
  } catch (error) {
    console.error('Error in upload-image route:', error);
    return c.json({ error: 'Failed to upload image' }, 500);
  }
});

// Get standalone yarns for a user
app.get('/make-server-b06c9f7a/standalone-yarns', async (c) => {
  try {
    const userId = await getUserFromToken(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const yarns = await kv.get(`standalone-yarns:${userId}`) || [];
    return c.json({ yarns });
  } catch (error) {
    console.error('Error fetching standalone yarns:', error);
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
    console.error('Error updating standalone yarns:', error);
    return c.json({ error: 'Failed to update standalone yarns' }, 500);
  }
});

// Get needle inventory for a user
app.get('/make-server-b06c9f7a/needle-inventory', async (c) => {
  try {
    const userId = await getUserFromToken(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const needles = await kv.get(`needle-inventory:${userId}`) || [];
    return c.json({ needles });
  } catch (error) {
    console.error('Error fetching needle inventory:', error);
    return c.json({ error: 'Failed to fetch needle inventory' }, 500);
  }
});

// Update needle inventory for a user
app.put('/make-server-b06c9f7a/needle-inventory', async (c) => {
  try {
    const userId = await getUserFromToken(c);
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { needles } = await c.req.json();
    await kv.set(`needle-inventory:${userId}`, needles);
    
    return c.json({ needles });
  } catch (error) {
    console.error('Error updating needle inventory:', error);
    return c.json({ error: 'Failed to update needle inventory' }, 500);
  }
});

// Admin: Reset password for a user (temporary development solution)
app.post('/make-server-b06c9f7a/admin/reset-password', async (c) => {
  try {
    const { email, newPassword } = await c.req.json();
    
    if (!email || !newPassword) {
      return c.json({ error: 'Email and newPassword are required' }, 400);
    }

    if (newPassword.length < 6) {
      return c.json({ error: 'Password must be at least 6 characters' }, 400);
    }

    // Find user by email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error listing users:', userError);
      return c.json({ error: 'Failed to find user' }, 500);
    }

    const user = userData.users.find(u => u.email === email);
    
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Update password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Error updating password:', updateError);
      return c.json({ error: 'Failed to update password' }, 500);
    }

    return c.json({ 
      success: true, 
      message: 'Password updated successfully',
      email: user.email 
    });
  } catch (error) {
    console.error('Error in reset-password route:', error);
    return c.json({ error: 'Failed to reset password' }, 500);
  }
});

Deno.serve(app.fetch);