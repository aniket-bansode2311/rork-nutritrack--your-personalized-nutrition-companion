import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, Stack } from 'expo-router';
import { X, Flashlight, FlashlightOff } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import type { BarcodeProduct } from '@/types/nutrition';

interface BarcodeData {
  type: string;
  data: string;
}

export default function BarcodeScanner() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [flashEnabled, setFlashEnabled] = useState<boolean>(false);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const lookupBarcode = async (barcode: string): Promise<BarcodeProduct | null> => {
    try {
      console.log('Looking up barcode:', barcode);
      
      // Using Nutritionix API as an example
      // In a real app, you'd use your preferred nutrition API
      const response = await fetch('https://trackapi.nutritionix.com/v2/search/item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-id': 'YOUR_APP_ID', // Replace with actual API credentials
          'x-app-key': 'YOUR_APP_KEY',
        },
        body: JSON.stringify({
          upc: barcode,
        }),
      });

      if (!response.ok) {
        throw new Error('Product not found');
      }

      const data = await response.json();
      const product = data.foods[0];

      if (!product) {
        throw new Error('Product not found');
      }

      return {
        barcode,
        name: product.food_name,
        brand: product.brand_name,
        servingSize: product.serving_weight_grams || 100,
        servingUnit: 'g',
        calories: Math.round(product.nf_calories || 0),
        protein: Math.round(product.nf_protein || 0),
        carbs: Math.round(product.nf_total_carbohydrate || 0),
        fat: Math.round(product.nf_total_fat || 0),
        fiber: Math.round(product.nf_dietary_fiber || 0),
        sugar: Math.round(product.nf_sugars || 0),
        sodium: Math.round(product.nf_sodium || 0),
        imageUrl: product.photo?.thumb,
        ingredients: product.nf_ingredient_statement?.split(', '),
      };
    } catch (error) {
      console.error('Barcode lookup error:', error);
      // Fallback to mock data for demo purposes
      return {
        barcode,
        name: 'Sample Product',
        brand: 'Sample Brand',
        servingSize: 100,
        servingUnit: 'g',
        calories: 250,
        protein: 8,
        carbs: 35,
        fat: 12,
        fiber: 3,
        sugar: 15,
        sodium: 400,
        imageUrl: 'https://via.placeholder.com/150',
      };
    }
  };

  const handleBarcodeScanned = async ({ data }: BarcodeData) => {
    if (scanned || loading) return;
    
    setScanned(true);
    setLoading(true);

    try {
      const product = await lookupBarcode(data);
      
      if (product) {
        // Navigate to food details with the scanned product
        router.push({
          pathname: '/food-details',
          params: {
            foodData: JSON.stringify({
              id: `barcode-${product.barcode}`,
              name: product.name,
              brand: product.brand,
              servingSize: product.servingSize,
              servingUnit: product.servingUnit,
              calories: product.calories,
              protein: product.protein,
              carbs: product.carbs,
              fat: product.fat,
              fiber: product.fiber,
              sugar: product.sugar,
              sodium: product.sodium,
              barcode: product.barcode,
              imageUrl: product.imageUrl,
            }),
            source: 'barcode',
          },
        });
      } else {
        Alert.alert(
          'Product Not Found',
          'We couldn\'t find nutritional information for this product. Please try again or add it manually.',
          [
            { text: 'Try Again', onPress: () => setScanned(false) },
            { text: 'Cancel', onPress: () => router.back() },
          ]
        );
      }
    } catch (error) {
      console.error('Error processing barcode:', error);
      Alert.alert(
        'Error',
        'There was an error processing the barcode. Please try again.',
        [
          { text: 'Try Again', onPress: () => setScanned(false) },
          { text: 'Cancel', onPress: () => router.back() },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Camera permission is required to scan barcodes</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Scan Barcode',
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
              <X color={colors.text} size={24} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => setFlashEnabled(!flashEnabled)}
              style={styles.headerButton}
            >
              {flashEnabled ? (
                <FlashlightOff color={colors.text} size={24} />
              ) : (
                <Flashlight color={colors.text} size={24} />
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <CameraView
        style={styles.camera}
        facing="back"
        enableTorch={flashEnabled}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['upc_a', 'upc_e', 'ean13', 'ean8', 'code128', 'code39'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.scanArea}>
            <View style={styles.scanFrame} />
          </View>
          
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionText}>
              Position the barcode within the frame
            </Text>
            <Text style={styles.subInstructionText}>
              Make sure the barcode is clearly visible and well-lit
            </Text>
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Looking up product...</Text>
            </View>
          )}

          {scanned && !loading && (
            <TouchableOpacity
              style={styles.scanAgainButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.scanAgainText}>Tap to scan again</Text>
            </TouchableOpacity>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: '100%',
    height: '100%',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 150,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  instructionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subInstructionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 100,
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  scanAgainButton: {
    position: 'absolute',
    bottom: 100,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scanAgainText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: colors.text,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  headerButton: {
    padding: 8,
  },
});