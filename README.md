# Suivi des trajets kilométriques

Application cross-platform (web + mobile) pour enregistrer vos déplacements, calculer la distance parcourue en kilomètres et estimer le montant de votre indemnité kilométrique.

## Fonctionnalités

- Ajouter un trajet avec départ et destination
- Calculer la distance automatiquement à partir des coordonnées GPS
- Saisir manuellement la distance si nécessaire
- Choisir le type de véhicule et le taux au km
- Calculer le montant estimé de l’indemnité
- Gérer l’historique des trajets
- Obtenir le total cumulé en km et en euros
- Fonctionne sous web et mobile via Expo

## Démarrage rapide

1. Installez les dépendances :
   ```bash
   npm install
   ```
2. Lancez l’application :
   ```bash
   npm start
   ```
3. Pour le web :
   ```bash
   npm run web
   ```

## Exemple de calcul

- Distance estimée : 465 km
- Taux : 0,58 €/km
- Coût : 269,70 €

## Stack technique

- Expo
- React Native
- TypeScript
- AsyncStorage

## Personnalisation

Vous pouvez ajuster les taux par véhicule dans le fichier `App.tsx` :

```ts
const VEHICLE_RATES: Record<VehicleType, number> = {
  Voiture: 0.58,
  Moto: 0.53,
  'Véhicule utilitaire': 0.68,
};
```
