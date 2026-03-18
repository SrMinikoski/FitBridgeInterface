import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HomePage } from './home-page/home-page'
import { Workoutpage } from './workoutpage/workoutpage';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HomePage, Workoutpage],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('FitBridgeInterface');
}
