import {Component, ElementRef, ViewChild, AfterViewInit, NgZone, inject} from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonItem,
  IonLabel,
  IonInput,
  IonList,
  IonModal,
  ModalController,
  AlertController
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import {search, navigate, locate, swapVertical, add, trash, save} from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { Router } from '@angular/router';
import { SaveRouteModalComponent } from '../components/save-route-modal/save-route-modal.component';
import { RouteStorageService } from '../services/route-storage';

import { list } from 'ionicons/icons';
addIcons({ list, save });

declare const google: any;

interface Location {
  lat: number;
  lng: number;
  address?: string;
  id: string;
}

@Component({
  selector: 'app-map-route',
  templateUrl: './map-route.page.html',
  styleUrls: ['./map-route.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonButton,
    IonIcon,
    IonItem,
    IonLabel,
    IonInput,
    IonList,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
  ]
})
export class MapRoutePage implements AfterViewInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  private ngZone = inject(NgZone);
  private modalCtrl = inject(ModalController);
  private routeStorage = inject(RouteStorageService);
  private router = inject(Router);
  private alertCtrl = inject(AlertController);

  map: any;
  directionsService: any;
  directionsRenderer: any;
  markers: Map<string, any> = new Map();
  waypoints: Location[] = [];
  geocoder: any;

  startLocation: Location | null = null;
  endLocation: Location | null = null;

  startAddress: string = '';
  endAddress: string = '';

  private idCounter = 0;
  public pendingWaypointIndex: number | null = null;

  canSave: boolean = false;

  constructor(
  ) {
    addIcons({
      search,
      navigate,
      locate,
      'swap-vertical': swapVertical,
      add,
      trash,
      save,
      list
    });
  }

  ngAfterViewInit() {
    this.initMap();
  }

  updateCanSave() {
    this.canSave = !!(this.startLocation && this.endLocation);
  }

  initMap() {
    const defaultCenter = { lat: 49.2245, lng: 17.6654 };

    this.map = new google.maps.Map(this.mapContainer.nativeElement, {
      center: defaultCenter,
      zoom: 12,
      mapTypeId: 'roadmap',
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    });

    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      map: this.map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#3880ff',
        strokeOpacity: 0.8,
        strokeWeight: 7
      }
    });

    this.geocoder = new google.maps.Geocoder();

    this.map.addListener('click', (event: any) => {
      this.handleMapClick(event.latLng);
    });
  }

  async handleMapClick(latLng: any) {
    const location: Location = {
      lat: latLng.lat(),
      lng: latLng.lng(),
      id: this.generateId()
    };

    // Get address immediately
    const address = await this.getAddressFromLatLng(location.lat, location.lng);
    location.address = address;

    // Update in Angular zone to trigger change detection
    this.ngZone.run(() => {
      if (!this.startLocation) {
        this.setStartLocation(location, address);
      } else if (!this.endLocation) {
        this.setEndLocation(location, address);
        this.calculateRoute();
      } else if (this.pendingWaypointIndex !== null) {
        // Update pending waypoint
        this.updateWaypointFromMap(this.pendingWaypointIndex, location, address);
        this.pendingWaypointIndex = null;
      } else {
        // Add new waypoint
        this.addWaypointFromMap(location, address);
      }
    });
  }

  getAddressFromLatLng(lat: number, lng: number): Promise<string> {
    return new Promise((resolve) => {
      this.geocoder.geocode({ location: { lat, lng } }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          resolve(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
        }
      });
    });
  }

  setStartLocation(location: Location, address: string) {
    this.startLocation = location;
    this.startAddress = address; // Immediate update
    this.startLocation.address = address;

    this.addMarker(location, 'start', 'http://maps.google.com/mapfiles/ms/icons/green-dot.png');
    this.map.panTo({ lat: location.lat, lng: location.lng });
    this.updateCanSave();
  }

  setEndLocation(location: Location, address: string) {
    this.endLocation = location;
    this.endAddress = address; // Immediate update
    this.endLocation.address = address;

    this.addMarker(location, 'end', 'http://maps.google.com/mapfiles/ms/icons/red-dot.png');

    this.updateCanSave();
    this.calculateRoute();
  }

  addWaypointFromMap(location: Location, address: string) {
    location.address = address;
    this.waypoints.push(location);
    this.addMarker(location, location.id, 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png');
    this.calculateRoute();
  }

  addWaypointInput() {
    const waypoint: Location = {
      lat: 0,
      lng: 0,
      address: '',
      id: this.generateId()
    };
    this.waypoints.push(waypoint);
    // Set this as pending so next map click updates it
    this.pendingWaypointIndex = this.waypoints.length - 1;
  }

  updateWaypointFromMap(index: number, location: Location, address: string) {
    const oldWaypoint = this.waypoints[index];

    // Remove old marker if exists
    if (this.markers.has(oldWaypoint.id)) {
      this.markers.get(oldWaypoint.id).setMap(null);
      this.markers.delete(oldWaypoint.id);
    }

    // Update waypoint
    this.waypoints[index] = {
      ...location,
      address: address,
      id: oldWaypoint.id
    };

    this.addMarker(this.waypoints[index], oldWaypoint.id, 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png');
    this.calculateRoute();
  }

  updateWaypointAddress(index: number, address: string) {
    this.waypoints[index].address = address;
    // Clear pending if user types manually
    if (this.pendingWaypointIndex === index) {
      this.pendingWaypointIndex = null;
    }
  }

  async searchWaypoint(index: number) {
    const address = this.waypoints[index].address;
    if (!address) return;

    const location = await this.geocodeAddressAsync(address);
    if (location) {
      this.ngZone.run(() => {
        const oldId = this.waypoints[index].id;

        // Remove old marker
        if (this.markers.has(oldId)) {
          this.markers.get(oldId).setMap(null);
        }

        this.waypoints[index] = {
          ...location,
          id: oldId,
          address: location.address || address
        };

        this.addMarker(this.waypoints[index], oldId, 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png');
        this.calculateRoute();
      });
    }
  }

  removeWaypoint(index: number) {
    const waypoint = this.waypoints[index];
    if (this.markers.has(waypoint.id)) {
      this.markers.get(waypoint.id).setMap(null);
      this.markers.delete(waypoint.id);
    }

    // Clear pending if removing the pending one
    if (this.pendingWaypointIndex === index) {
      this.pendingWaypointIndex = null;
    } else if (this.pendingWaypointIndex !== null && this.pendingWaypointIndex > index) {
      this.pendingWaypointIndex--; // Adjust index
    }

    this.waypoints.splice(index, 1);
    this.calculateRoute();
  }

  generateId(): string {
    return `loc_${++this.idCounter}_${Date.now()}`;
  }

  addMarker(location: Location, id: string, iconUrl: string) {
    if (this.markers.has(id)) {
      this.markers.get(id).setMap(null);
    }

    const marker = new google.maps.Marker({
      position: { lat: location.lat, lng: location.lng },
      map: this.map,
      title: id === 'start' ? 'Start' : id === 'end' ? 'End' : 'Waypoint',
      icon: {
        url: iconUrl,
        scaledSize: new google.maps.Size(40, 40)
      },
      animation: google.maps.Animation.DROP
    });

    this.markers.set(id, marker);
  }

  calculateRoute() {
    if (!this.startLocation || !this.endLocation) return;

    const validWaypoints = this.waypoints.filter(wp => wp.lat !== 0 && wp.lng !== 0);

    const waypointsForRequest = validWaypoints.map(wp => ({
      location: { lat: wp.lat, lng: wp.lng },
      stopover: true
    }));

    const request: any = {
      origin: { lat: this.startLocation.lat, lng: this.startLocation.lng },
      destination: { lat: this.endLocation.lat, lng: this.endLocation.lng },
      travelMode: google.maps.TravelMode.DRIVING,
      optimizeWaypoints: false
    };

    if (waypointsForRequest.length > 0) {
      request.waypoints = waypointsForRequest;
    }

    this.directionsService.route(request, (result: any, status: any) => {
      this.ngZone.run(() => {
        if (status === 'OK') {
          this.directionsRenderer.setDirections(result);

          const bounds = new google.maps.LatLngBounds();
          bounds.extend({ lat: this.startLocation!.lat, lng: this.startLocation!.lng });
          bounds.extend({ lat: this.endLocation!.lat, lng: this.endLocation!.lng });

          validWaypoints.forEach(wp => {
            bounds.extend({ lat: wp.lat, lng: wp.lng });
          });

          this.map.fitBounds(bounds);
        } else {
          console.error('Directions request failed:', status);
          this.drawStraightLine(validWaypoints);
        }
      });
    });
  }

  drawStraightLine(validWaypoints: Location[]) {
    const path = [
      { lat: this.startLocation!.lat, lng: this.startLocation!.lng },
      ...validWaypoints.map(wp => ({ lat: wp.lat, lng: wp.lng })),
      { lat: this.endLocation!.lat, lng: this.endLocation!.lng }
    ];

    if (this.directionsRenderer) {
      this.directionsRenderer.setDirections({ routes: [] });
    }

    const polyline = new google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: '#3880ff',
      strokeOpacity: 1.0,
      strokeWeight: 4,
      map: this.map
    });

    const bounds = new google.maps.LatLngBounds();
    path.forEach(point => bounds.extend(point));
    this.map.fitBounds(bounds);
  }

  async searchStart() {
    const location = await this.geocodeAddressAsync(this.startAddress);
    if (location) {
      this.ngZone.run(() => {
        this.setStartLocation({ ...location, id: 'start' }, location.address || this.startAddress);
        if (this.endLocation) this.calculateRoute();
      });
    }
  }

  async searchEnd() {
    const location = await this.geocodeAddressAsync(this.endAddress);
    if (location) {
      this.ngZone.run(() => {
        this.setEndLocation({ ...location, id: 'end' }, location.address || this.endAddress);
        if (this.startLocation) this.calculateRoute();
      });
    }
  }

  geocodeAddressAsync(address: string): Promise<Location | null> {
    return new Promise((resolve) => {
      this.geocoder.geocode({ address }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          resolve({
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng(),
            address: results[0].formatted_address,
            id: this.generateId()
          });
        } else {
          alert('Geocode was not successful: ' + status);
          resolve(null);
        }
      });
    });
  }

  useCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const address = await this.getAddressFromLatLng(lat, lng);

          this.ngZone.run(() => {
            const location: Location = {
              lat,
              lng,
              address,
              id: 'start'
            };
            this.setStartLocation(location, address);
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Could not get current location');
        }
      );
    } else {
      alert('Geolocation is not supported by this browser');
    }
  }

  clearRoute() {
    this.startLocation = null;
    this.endLocation = null;
    this.startAddress = '';
    this.endAddress = '';
    this.waypoints = [];
    this.idCounter = 0;
    this.pendingWaypointIndex = null;

    this.markers.forEach(marker => marker.setMap(null));
    this.markers.clear();

    this.directionsRenderer.setDirections({ routes: [] });
    this.canSave = false;
  }


  async saveRoute() {
    if (!this.startLocation || !this.endLocation) return;

    const modal = await this.modalCtrl.create({
      component: SaveRouteModalComponent,
      componentProps: {
        startAddress: this.startAddress,
        endAddress: this.endAddress,
        waypointCount: this.waypoints.filter(wp => wp.lat !== 0).length
      },
      cssClass: 'save-route-modal'
    });

    await modal.present();
    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data?.name) {
        await this.storeRoute(data.name);
    }
  }

  private async storeRoute(name: string) {
    const validWaypoints = this.waypoints
      .filter(wp => wp.lat !== 0 && wp.lng !== 0)
      .map(wp => ({
        lat: wp.lat,
        lng: wp.lng,
        address: wp.address || ''
      }));
    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: this.startLocation!.lat, lng: this.startLocation!.lng });
    bounds.extend({ lat: this.endLocation!.lat, lng: this.endLocation!.lng });
    validWaypoints.forEach(wp => bounds.extend({ lat: wp.lat, lng: wp.lng }));

    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    await this.routeStorage.saveRoute({
      name,
      start: {
        lat: this.startLocation!.lat,
        lng: this.startLocation!.lng,
        address: this.startAddress
      },
      end: {
        lat: this.endLocation!.lat,
        lng: this.endLocation!.lng,
        address: this.endAddress
      },
      waypoints: validWaypoints,
      bounds: {
        north: ne.lat(),
        south: sw.lat(),
        east: ne.lng(),
        west: sw.lng()
      }
    });

    const alert = await this.alertCtrl.create({
      header: 'Route Saved',
      message: `"${name}" has been saved successfully.`,
      buttons: [
        {
          text: 'Stay Here',
          role: 'cancel'
        },
        {
          text: 'View Saved',
          handler: () => {
            this.router.navigate(['/saved-routes']);
          }
        }
      ]
    });

    await alert.present();
  }

  viewSavedRoutes() {
    this.router.navigate(['/saved-routes']);
  }
  swapLocations() {
    const temp = this.startLocation;
    this.startLocation = this.endLocation;
    this.endLocation = temp;

    const tempAddr = this.startAddress;
    this.startAddress = this.endAddress;
    this.endAddress = tempAddr;

    if (this.startLocation) {
      this.startLocation.id = 'start';
      this.addMarker(this.startLocation, 'start', 'http://maps.google.com/mapfiles/ms/icons/green-dot.png');
    }
    if (this.endLocation) {
      this.endLocation.id = 'end';
      this.addMarker(this.endLocation, 'end', 'http://maps.google.com/mapfiles/ms/icons/red-dot.png');
    }

    this.calculateRoute();
  }

  // Helper to check if waypoint is pending
  isPending(index: number): boolean {
    return this.pendingWaypointIndex === index;
  }
}
