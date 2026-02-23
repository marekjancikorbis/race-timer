import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export interface SavedRoute {
  id: string;
  name: string;
  createdAt: number;
  start: {
    lat: number;
    lng: number;
    address: string;
  };
  end: {
    lat: number;
    lng: number;
    address: string;
  };
  waypoints: {
    lat: number;
    lng: number;
    address: string;
  }[];
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class RouteStorageService {
  private readonly STORAGE_KEY = 'saved_routes';

  async saveRoute(route: Omit<SavedRoute, 'id' | 'createdAt'>): Promise<SavedRoute> {
    const routes = await this.getAllRoutes();

    const newRoute: SavedRoute = {
      ...route,
      id: this.generateId(),
      createdAt: Date.now()
    };

    routes.push(newRoute);
    await this.saveAllRoutes(routes);

    return newRoute;
  }

  async getAllRoutes(): Promise<SavedRoute[]> {
    const { value } = await Preferences.get({ key: this.STORAGE_KEY });
    return value ? JSON.parse(value) : [];
  }

  async getRouteById(id: string): Promise<SavedRoute | null> {
    const routes = await this.getAllRoutes();
    return routes.find(r => r.id === id) || null;
  }

  async deleteRoute(id: string): Promise<void> {
    const routes = await this.getAllRoutes();
    const filtered = routes.filter(r => r.id !== id);
    await this.saveAllRoutes(filtered);
  }

  async updateRoute(updatedRoute: SavedRoute): Promise<void> {
    const routes = await this.getAllRoutes();
    const index = routes.findIndex(r => r.id === updatedRoute.id);
    if (index !== -1) {
      routes[index] = updatedRoute;
      await this.saveAllRoutes(routes);
    }
  }

  private async saveAllRoutes(routes: SavedRoute[]): Promise<void> {
    await Preferences.set({
      key: this.STORAGE_KEY,
      value: JSON.stringify(routes)
    });
  }

  private generateId(): string {
    return `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
