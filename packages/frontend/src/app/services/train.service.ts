import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TrainService {
  constructor() {}

  getTrains() {
    // TODO: Implement API call
    return [];
  }

  searchTrains(departure: string, arrival: string, date: Date) {
    // TODO: Implement API call
    return [];
  }
}
