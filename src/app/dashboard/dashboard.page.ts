import { Component } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  ModalController, IonButtons
} from '@ionic/angular/standalone';
import { add } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { AddItemModalComponent } from '../components/add-item-modal/add-item-modal.component';
import {NgForOf} from "@angular/common";

interface GridItem {
  id: number;
  title: string;
  description: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButton,
    IonIcon,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardContent,
    IonButtons,
    NgForOf
  ]
})
export class DashboardPage {
  items: GridItem[] = [];

  constructor(private modalCtrl: ModalController) {
    addIcons({ add });
  }

  async openAddModal() {
    const modal = await this.modalCtrl.create({
      component: AddItemModalComponent,
      cssClass: 'add-item-modal'
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data) {
      this.addItem(data);
    }
  }

  addItem(newItem: { title: string; description: string }) {
    const colors = ['#3880ff', '#5260ff', '#2dd36f', '#ffc409', '#eb445a', '#92949c'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const item: GridItem = {
      id: this.items.length + 1,
      title: newItem.title,
      description: newItem.description,
      color: randomColor
    };

    this.items.unshift(item); // Add to beginning
  }
}
