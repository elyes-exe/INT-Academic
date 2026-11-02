'use client';

export async function fetchResource<T>(resource: string): Promise<T[]> {
  const response = await fetch(`/api/dashboard/${resource}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Unable to load data.');
  }

  return data.data;
}

export async function saveResource<T extends { id?: number | string }>(resource: string, item: T): Promise<T> {
  const response = await fetch(`/api/dashboard/${resource}`, {
    method: item.id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Unable to save data.');
  }

  return data.item;
}

export async function deleteResource(resource: string, id: number | string) {
  const response = await fetch(`/api/dashboard/${resource}?id=${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Unable to delete data.');
  }

  return data.deleted;
}
