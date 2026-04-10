const apiUrl = 'http://localhost:3001/api';

const makeEntity = (entityName) => ({
  list: async (sort = '', limit = 100) => {
    try {
      const res = await fetch(`${apiUrl}/${entityName}?sort=${sort}&limit=${limit}`);
      return await res.json();
    } catch {
      return [];
    }
  },

  filter: async (query, sort = '', limit = 100) => {
    try {
      const params = new URLSearchParams({ ...query, sort, limit });
      const res = await fetch(`${apiUrl}/${entityName}?${params.toString()}`);
      return await res.json();
    } catch {
      return [];
    }
  },

  create: async (data) => {
    const res = await fetch(`${apiUrl}/${entityName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  update: async (id, data) => {
    const res = await fetch(`${apiUrl}/${entityName}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return await res.json();
  },

  delete: async (id) => {
    const res = await fetch(`${apiUrl}/${entityName}/${id}`, {
      method: 'DELETE'
    });
    return await res.json();
  },
});

export const base44 = {
  auth: {
    me: async () => ({ id: 1, name: 'Admin', role: 'admin' }),
    logout: () => { },
    redirectToLogin: () => { }
  },
  entities: {
    Microservice: makeEntity('Microservice'),
    ChaosExperiment: makeEntity('ChaosExperiment'),
    SystemAlert: makeEntity('SystemAlert'),
    ExperimentTemplate: makeEntity('ExperimentTemplate'),
    ScheduledExperiment: makeEntity('ScheduledExperiment'),
    Setting: makeEntity('Setting')
  }
};