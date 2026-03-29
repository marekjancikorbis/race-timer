import {Component, OnInit, ViewChild, ElementRef, AfterViewInit, inject} from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonFab,
  IonFabButton,
  AlertController,
  NavController
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { add, trash, navigate, map as mapIcon } from 'ionicons/icons';
import { RouteStorageService, SavedRoute } from '../services/route-storage';

declare const google: any;

@Component({
  selector: 'app-saved-routes',
  templateUrl: './saved-routes.page.html',
  styleUrls: ['./saved-routes.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonFab,
    IonFabButton
  ]
})
export class SavedRoutesPage implements OnInit {
   savedRoutes: SavedRoute[] = [];
  mapInstances: Map<string, any> = new Map();

  private routeStorage = inject(RouteStorageService);
  private alertCtrl = inject(AlertController);
  private navCtrl = inject(NavController);
  private router = inject(Router);

  constructor() {
    addIcons({ add, trash, navigate, 'map': mapIcon });
  }

  async ngOnInit() {
    await this.loadRoutes();
  }
  async loadRoutes() {
    this.savedRoutes = await this.routeStorage.getAllRoutes();
    // Initialize mini maps after view updates
    setTimeout(() => this.initMiniMaps(), 100);
  }

  initMiniMaps() {
    this.savedRoutes.forEach(route => {
      const mapElement = document.getElementById(`map-${route.id}`);
      if (!mapElement || this.mapInstances.has(route.id)) return;

      const map = new google.maps.Map(mapElement, {
        center: {
          lat: (route.bounds.north + route.bounds.south) / 2,
          lng: (route.bounds.east + route.bounds.west) / 2
        },
        zoom: 10,
        mapTypeId: 'roadmap',
        disableDefaultUI: true,
        draggable: false,
        zoomControl: false,
        scrollwheel: false,
        disableDoubleClickZoom: true
      });

      // Draw route line
      const path = [
        { lat: route.start.lat, lng: route.start.lng },
        ...route.waypoints.map((wp: { lat: any; lng: any; }) => ({ lat: wp.lat, lng: wp.lng })),
        { lat: route.end.lat, lng: route.end.lng }
      ];

      const polyline = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#3880ff',
        strokeOpacity: 1,
        strokeWeight: 3,
        map: map
      });

      // Add markers
      new google.maps.Marker({
        position: { lat: route.start.lat, lng: route.start.lng },
        map: map,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
          scaledSize: new google.maps.Size(30, 30)
        }
      });

      new google.maps.Marker({
        position: { lat: route.end.lat, lng: route.end.lng },
        map: map,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
          scaledSize: new google.maps.Size(30, 30)
        }
      });

      // Fit bounds
      const bounds = new google.maps.LatLngBounds();
      path.forEach(point => bounds.extend(point));
      map.fitBounds(bounds);

      this.mapInstances.set(route.id, map);
    });
  }

  async deleteRoute(route: SavedRoute, event: Event) {
    event.stopPropagation();

    const alert = await this.alertCtrl.create({
      header: 'Delete Route',
      message: `Are you sure you want to delete "${route.name}"?`,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await this.routeStorage.deleteRoute(route.id);
            this.mapInstances.delete(route.id);
            await this.loadRoutes();
          }
        }
      ]
    });

    await alert.present();
  }

  loadRoute(route: SavedRoute) {
    // Navigate to map with route data
    this.navCtrl.navigateForward('/map', {
      state: { route }
    });
  }

  createNewRoute() {
    this.navCtrl.navigateForward('/map');
  }

  formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
