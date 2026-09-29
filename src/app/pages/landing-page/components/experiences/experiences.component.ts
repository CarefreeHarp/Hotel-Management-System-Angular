import { Component } from '@angular/core';

// Contenido de cada tarjeta de experiencia; no es una entidad del backend.
interface Experience {
  category: string;
  title: string;
  schedule: string;
  imageUrl: string;
  imageAlt: string;
  tagline: string;
  description: string;
  highlights: string[];
}

@Component({
  selector: 'app-experiences',
  imports: [],
  templateUrl: './experiences.component.html',
  styleUrl: './experiences.component.scss'
})
export class ExperiencesComponent {
  experiences: Experience[] = [
    {
      category: 'On the water',
      title: 'Sunset Catamaran',
      schedule: 'Daily at 5:30 pm',
      imageUrl: 'https://cache.marriott.com/is/image/marriotts7prod/rz-dpssw-bejana-restaurant-16761:Classic-Hor?wid=1200&fit=constrain',
      imageAlt: 'Sunset Catamaran',
      tagline: 'Golden hour at sea',
      description: 'Set sail along the coast with chilled drinks, small plates and an unobstructed sunset.',
      highlights: ['90-minute cruise', 'Welcome drink included', 'Limited to 12 guests'],
    },
    {
      category: 'Adventure',
      title: 'Reef Discovery Dive',
      schedule: 'Every morning at 8:00 am',
      imageUrl: 'https://cache.marriott.com/content/dam/marriott-renditions/DPSSW/dpssw-villa-0020-hor-wide.jpg?output-quality=70&interpolation=progressive-bilinear&downsize=540px:*',
      imageAlt: 'Reef discovery dive',
      tagline: 'Meet the reef',
      description: 'A relaxed guided dive for curious beginners and returning underwater explorers.',
      highlights: ['Certified instructor', 'Equipment included', 'All levels welcome'],
    },
    {
      category: 'Wellness',
      title: 'Tide Room Ritual',
      schedule: 'Daily, 8:00 am – 8:00 pm',
      imageUrl: 'https://cache.marriott.com/content/dam/marriott-renditions/DPSSW/dpssw-villa-0030-hor-wide.jpg?output-quality=70&interpolation=progressive-bilinear&downsize=540px:*',
      imageAlt: 'Tide Room spa ritual',
      tagline: 'Restore slowly',
      description: 'A warm salt soak, traditional Balinese massage and herbal tea in a private treatment room.',
      highlights: ['75-minute treatment', 'Natural local oils', 'Advance booking advised'],
    },
    {
      category: 'Dining',
      title: 'Balinese Table',
      schedule: 'Tuesdays and Fridays',
      imageUrl: 'https://cache.marriott.com/is/image/marriotts7prod/rz-dpssw-dpssw-junior-suite-12993:Wide-Hor?wid=540&fit=constrain',
      imageAlt: 'Balinese cooking class',
      tagline: 'Cook with the island',
      description: 'Learn to prepare a seasonal Balinese lunch with the chefs who know the market best.',
      highlights: ['Market-inspired menu', 'Lunch included', 'Small-group class'],
    },
  ];
}
