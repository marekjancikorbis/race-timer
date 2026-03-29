import {Component, inject} from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonButtons,
  IonText,
  ModalController, IonIcon
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import {RouteStorageService} from "../../services/route-storage";

@Component({
  selector: 'app-save-route-modal',
  templateUrl: './save-route-modal.component.html',
  styleUrls: ['./save-route-modal.component.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonButtons,
    IonItem,
    IonLabel,
    IonInput,
    IonText,
    FormsModule,
    IonIcon
  ]
})
export class SaveRouteModalComponent {
  routeName: string = '';
  startAddress: string = '';
  endAddress: string = '';
  waypointCount: number = 0;

  private modalCtrl = inject(ModalController);

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    if (this.routeName.trim()) {
      return this.modalCtrl.dismiss(
        { name: this.routeName.trim() },
        'confirm'
      );
    }else {
      return this.modalCtrl.dismiss()
    }
  }
}
