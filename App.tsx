import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type VehicleType = 'Voiture' | 'Moto' | 'Véhicule utilitaire';

type Trip = {
  id: string;
  start: string;
  destination: string;
  distanceKm: number;
  rate: number;
  cost: number;
  vehicle: VehicleType;
  date: string;
  notes: string;
};

const VEHICLE_RATES: Record<VehicleType, number> = {
  Voiture: 0.58,
  Moto: 0.53,
  'Véhicule utilitaire': 0.68,
};

const STORAGE_KEY = 'kilometric-expense-trips';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);

const parseNumber = (value: string) => {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const calculateDistanceFromCoordinates = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const earthRadiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

export default function App() {
  const [start, setStart] = useState('Paris');
  const [destination, setDestination] = useState('Lyon');
  const [startLat, setStartLat] = useState('48.8566');
  const [startLon, setStartLon] = useState('2.3522');
  const [endLat, setEndLat] = useState('45.7640');
  const [endLon, setEndLon] = useState('4.8357');
  const [distanceKmInput, setDistanceKmInput] = useState('465');
  const [vehicle, setVehicle] = useState<VehicleType>('Voiture');
  const [rate, setRate] = useState(String(VEHICLE_RATES.Voiture));
  const [notes, setNotes] = useState('');
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const loadTrips = async () => {
      try {
        const savedTrips = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedTrips) {
          setTrips(JSON.parse(savedTrips));
        }
      } catch (error) {
        console.error('Erreur de chargement des trajets', error);
      }
    };

    loadTrips();
  }, []);

  useEffect(() => {
    const saveTrips = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
      } catch (error) {
        console.error('Erreur de sauvegarde des trajets', error);
      }
    };

    saveTrips();
  }, [trips]);

  const autoDistance = useMemo(() => {
    const lat1 = parseNumber(startLat);
    const lon1 = parseNumber(startLon);
    const lat2 = parseNumber(endLat);
    const lon2 = parseNumber(endLon);

    if (
      !Number.isNaN(lat1) &&
      !Number.isNaN(lon1) &&
      !Number.isNaN(lat2) &&
      !Number.isNaN(lon2) &&
      lat1 !== 0 &&
      lon1 !== 0 &&
      lat2 !== 0 &&
      lon2 !== 0
    ) {
      return calculateDistanceFromCoordinates(lat1, lon1, lat2, lon2);
    }

    return parseNumber(distanceKmInput);
  }, [startLat, startLon, endLat, endLon, distanceKmInput]);

  const effectiveRate = useMemo(() => {
    const baseRate = parseNumber(rate) || VEHICLE_RATES[vehicle];
    return baseRate > 0 ? baseRate : VEHICLE_RATES[vehicle];
  }, [rate, vehicle]);

  const totalCost = useMemo(() => {
    const distance = Math.max(0, autoDistance);
    return distance * effectiveRate;
  }, [autoDistance, effectiveRate]);

  const totalDistance = useMemo(
    () => trips.reduce((sum, trip) => sum + trip.distanceKm, 0),
    [trips],
  );

  const totalAmount = useMemo(
    () => trips.reduce((sum, trip) => sum + trip.cost, 0),
    [trips],
  );

  const handleCalculateDistance = () => {
    const lat1 = parseNumber(startLat);
    const lon1 = parseNumber(startLon);
    const lat2 = parseNumber(endLat);
    const lon2 = parseNumber(endLon);

    if (
      lat1 !== 0 &&
      lon1 !== 0 &&
      lat2 !== 0 &&
      lon2 !== 0 &&
      [lat1, lon1, lat2, lon2].every((value) => Number.isFinite(value))
    ) {
      const distance = calculateDistanceFromCoordinates(lat1, lon1, lat2, lon2);
      setDistanceKmInput(distance.toFixed(1));
      return;
    }

    Alert.alert('Information', 'Saisissez des coordonnées valides pour calculer automatiquement la distance.');
  };

  const handleSaveTrip = () => {
    if (!start.trim() || !destination.trim()) {
      Alert.alert('Erreur', 'Le départ et la destination sont obligatoires.');
      return;
    }

    const calculatedDistance = Math.max(0, autoDistance);
    const trip: Trip = {
      id: Date.now().toString(),
      start: start.trim(),
      destination: destination.trim(),
      distanceKm: Number(calculatedDistance.toFixed(1)),
      rate: effectiveRate,
      cost: Number(totalCost.toFixed(2)),
      vehicle,
      date: new Date().toISOString(),
      notes: notes.trim(),
    };

    setTrips((currentTrips) => [trip, ...currentTrips]);
    setNotes('');
    Alert.alert('Succès', 'Le trajet a été enregistré dans votre historique.');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Feuille d'indemnité kilométrique</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Nouveau trajet</Text>

        <Text style={styles.label}>Départ</Text>
        <TextInput
          value={start}
          onChangeText={setStart}
          placeholder="Ex. Paris"
          style={styles.input}
        />

        <Text style={styles.label}>Destination</Text>
        <TextInput
          value={destination}
          onChangeText={setDestination}
          placeholder="Ex. Lyon"
          style={styles.input}
        />

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Lat départ</Text>
            <TextInput
              value={startLat}
              onChangeText={setStartLat}
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </View>

          <View style={styles.column}>
            <Text style={styles.label}>Lon départ</Text>
            <TextInput
              value={startLon}
              onChangeText={setStartLon}
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Lat arrivée</Text>
            <TextInput
              value={endLat}
              onChangeText={setEndLat}
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </View>

          <View style={styles.column}>
            <Text style={styles.label}>Lon arrivée</Text>
            <TextInput
              value={endLon}
              onChangeText={setEndLon}
              keyboardType="decimal-pad"
              style={styles.input}
            />
          </View>
        </View>

        <Text style={styles.label}>Distance (km)</Text>
        <TextInput
          value={distanceKmInput}
          onChangeText={setDistanceKmInput}
          keyboardType="decimal-pad"
          style={styles.input}
        />

        <TouchableOpacity style={styles.secondaryButton} onPress={handleCalculateDistance}>
          <Text style={styles.secondaryButtonText}>Calculer la distance</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Véhicule</Text>
        <View style={styles.pillRow}>
          {(['Voiture', 'Moto', 'Véhicule utilitaire'] as VehicleType[]).map((item) => (
            <TouchableOpacity
              key={item}
              style={[styles.pill, vehicle === item && styles.pillActive]}
              onPress={() => {
                setVehicle(item);
                setRate(String(VEHICLE_RATES[item]));
              }}
            >
              <Text style={[styles.pillText, vehicle === item && styles.pillTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Taux en €/km</Text>
        <TextInput
          value={rate}
          onChangeText={setRate}
          keyboardType="decimal-pad"
          style={styles.input}
        />

        <Text style={styles.label}>Note</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Mission, client, déplacement..."
          multiline
          style={[styles.input, styles.textArea]}
        />

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Distance calculée</Text>
          <Text style={styles.summaryValue}>{autoDistance.toFixed(1)} km</Text>
        </View>

        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Montant estimé</Text>
          <Text style={styles.summaryValue}>{formatCurrency(totalCost)}</Text>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleSaveTrip}>
          <Text style={styles.primaryButtonText}>Enregistrer le trajet</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Synthèse</Text>
        <Text style={styles.metric}>Distance totale : {totalDistance.toFixed(1)} km</Text>
        <Text style={styles.metric}>Montant total : {formatCurrency(totalAmount)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Historique</Text>

        {trips.length === 0 ? (
          <Text style={styles.emptyText}>Aucun trajet enregistré pour le moment.</Text>
        ) : (
          trips.map((trip) => (
            <View key={trip.id} style={styles.tripItem}>
              <Text style={styles.tripTitle}>{trip.start} → {trip.destination}</Text>
              <Text style={styles.tripMeta}>{new Date(trip.date).toLocaleDateString('fr-FR')}</Text>
              <Text style={styles.tripMeta}>{trip.distanceKm.toFixed(1)} km • {trip.vehicle}</Text>
              <Text style={styles.tripMeta}>Taux : {trip.rate.toFixed(2)} €/km</Text>
              <Text style={styles.tripTotal}>{formatCurrency(trip.cost)}</Text>
              {trip.notes ? <Text style={styles.tripNotes}>{trip.notes}</Text> : null}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 50,
    backgroundColor: '#f5f7fb',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
    color: '#1b1b2f',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1b1b2f',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#2a3142',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#dfe6f1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#f8fafc',
    fontSize: 15,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  column: {
    flex: 1,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
  },
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#dfe6f1',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillActive: {
    backgroundColor: '#243bff',
    borderColor: '#243bff',
  },
  pillText: {
    fontSize: 13,
    color: '#2a3142',
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: '#e9f0ff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: '#243bff',
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: '#1dbf73',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  summaryBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#edf2f7',
  },
  summaryTitle: {
    color: '#5e6b82',
    fontWeight: '600',
  },
  summaryValue: {
    marginTop: 6,
    fontSize: 24,
    fontWeight: '700',
    color: '#1b1b2f',
  },
  metric: {
    fontSize: 16,
    color: '#2a3142',
    marginBottom: 8,
  },
  emptyText: {
    color: '#5e6b82',
    fontSize: 15,
  },
  tripItem: {
    borderWidth: 1,
    borderColor: '#edf2f7',
    backgroundColor: '#fafbfd',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  tripTitle: {
    color: '#1b1b2f',
    fontWeight: '700',
    fontSize: 15,
  },
  tripMeta: {
    color: '#5e6b82',
    marginTop: 4,
  },
  tripTotal: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '700',
    color: '#1dbf73',
  },
  tripNotes: {
    marginTop: 8,
    color: '#2a3142',
    fontStyle: 'italic',
  },
});
