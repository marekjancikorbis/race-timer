import { Component } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  ModalController, IonButtons
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-item-modal',
  templateUrl: './add-item-modal.component.html',
  styleUrls: ['./add-item-modal.component.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    FormsModule,
    IonButtons
  ]
})
export class AddItemModalComponent {
  title: string = '';
  description: string = '';

  constructor(private modalCtrl: ModalController) {}

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    if (this.title.trim() && this.description.trim()) {
      return this.modalCtrl.dismiss(
        {
          title: this.title,
          description: this.description
        },
        'confirm'
      );
    }
    else {
      return this.modalCtrl.dismiss()
    }
  }
}
