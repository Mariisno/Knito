import { projectId, publicAnonKey } from './supabase/info.tsx';
import type { KnittingProject, Yarn, NeedleInventoryItem } from '../types/knitting';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-b06c9f7a`;

function getHeaders(accessToken?: string) {
  return {
    'Content-Type': 'application/json',
    // Always use publicAnonKey for Edge Functions
    'Authorization': `Bearer ${publicAnonKey}`,
    // Send user ID in a custom header if we have an access token
    ...(accessToken ? { 'X-User-Token': accessToken } : {}),
  };
}

export async function signup(email: string, password: string, name: string) {
  const response = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password, name }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Error during signup:', error);
    throw new Error(error.error || 'Failed to create account');
  }
  
  return response.json();
}

export async function getAllProjects(accessToken: string): Promise<KnittingProject[]> {
  console.log('getAllProjects called with token:', accessToken?.substring(0, 20));
  const url = `${API_BASE}/projects`;
  console.log('Fetching from:', url);
  
  const response = await fetch(url, { 
    headers: getHeaders(accessToken) 
  });
  
  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error fetching projects:', errorText);
    throw new Error('Failed to fetch projects');
  }
  
  const data = await response.json();
  return data.projects || [];
}

export async function createProject(project: KnittingProject, accessToken: string): Promise<KnittingProject> {
  console.log('Creating project:', JSON.stringify(project, null, 2));
  
  const response = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: getHeaders(accessToken),
    body: JSON.stringify(project),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Error creating project:', error);
    throw new Error('Failed to create project');
  }
  
  const data = await response.json();
  console.log('Project created successfully:', data.project);
  return data.project;
}

export async function updateProject(id: string, updates: Partial<KnittingProject>, accessToken: string): Promise<KnittingProject> {
  console.log('Updating project:', id);
  console.log('Updates:', JSON.stringify(updates, null, 2));
  
  const response = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'PUT',
    headers: getHeaders(accessToken),
    body: JSON.stringify(updates),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Error updating project:', error);
    throw new Error('Failed to update project');
  }
  
  const data = await response.json();
  console.log('Project updated successfully:', data.project);
  return data.project;
}

export async function deleteProject(id: string, accessToken: string): Promise<void> {
  const response = await fetch(`${API_BASE}/projects/${id}`, {
    method: 'DELETE',
    headers: getHeaders(accessToken),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Error deleting project:', error);
    throw new Error('Failed to delete project');
  }
}

export async function uploadImage(file: File, accessToken: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE}/upload-image`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'X-User-Token': accessToken,
    },
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
  
  const data = await response.json();
  return data.url;
}

export async function getStandaloneYarns(accessToken: string): Promise<Yarn[]> {
  const response = await fetch(`${API_BASE}/standalone-yarns`, { 
    headers: getHeaders(accessToken) 
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Error fetching standalone yarns:', error);
    throw new Error('Failed to fetch standalone yarns');
  }
  
  const data = await response.json();
  return data.yarns || [];
}

export async function updateStandaloneYarns(yarns: Yarn[], accessToken: string): Promise<Yarn[]> {
  const response = await fetch(`${API_BASE}/standalone-yarns`, {
    method: 'PUT',
    headers: getHeaders(accessToken),
    body: JSON.stringify({ yarns }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Error updating standalone yarns:', error);
    throw new Error('Failed to update standalone yarns');
  }
  
  const data = await response.json();
  return data.yarns;
}
export async function getNeedleInventory(accessToken: string): Promise<NeedleInventoryItem[]> {
  const response = await fetch(\/needle-inventory, { 
    headers: getHeaders(accessToken) 
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Error fetching needle inventory:', error);
    throw new Error('Failed to fetch needle inventory');
  }
  
  const data = await response.json();
  return data.needles || [];
}

export async function updateNeedleInventory(needles: NeedleInventoryItem[], accessToken: string): Promise<NeedleInventoryItem[]> {
  const response = await fetch(\/needle-inventory, {
    method: 'PUT',
    headers: getHeaders(accessToken),
    body: JSON.stringify({ needles }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Error updating needle inventory:', error);
    throw new Error('Failed to update needle inventory');
  }
  
  const data = await response.json();
  return data.needles;
}
