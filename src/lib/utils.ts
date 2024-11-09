import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {distance as levenshteinDistance} from "fastest-levenshtein"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function compareNames(producer: string, winery: string): number {
  const producerWords = producer.split(' ');
  const wineryWords = winery.split(' ');

  let totalDistance = 0;
  let comparisons = 0;

  producerWords.forEach(pWord => {
    let minDistance = Infinity;
    wineryWords.forEach(wWord => {
      const dist = levenshteinDistance(pWord, wWord);
      if (dist < minDistance) {
        minDistance = dist;
      }
    });
    totalDistance += minDistance;
    comparisons++;
  });

  const averageDistance = totalDistance / comparisons;
  const threshold = 5; // Adjust this threshold based on your requirements

  return averageDistance;
}