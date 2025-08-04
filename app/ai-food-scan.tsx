import React, { useState, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator, Platform } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Camera, FlipHorizontal, Sparkles, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import { colors } from '@/constants/colors';
import { useNutrition } from '@/hooks/useNutritionStore';
import { FoodItem, MealEntry } from '@/types/nutrition';

export default function AIFoodScanScreen() {
  const router = useRouter();
  const { mealType } = useLocalSearchParams<{ mealType?: MealEntry['mealType'] }>();
  const { addMealEntry, addFoodItem } = useNutrition();
  
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const cameraRef = useRef<CameraView>(null);
  
  if (!permission) {
    return <View style={styles.container} />;
  }
  
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Camera size={64} color={colors.primary} />
        <Text style={styles.permissionTitle}>Camera Access Required</Text>
        <Text style={styles.permissionMessage}>
          We need camera access to scan and identify your food for accurate nutrition tracking.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };
  
  const analyzeFood = async (imageUri: string) => {
    setIsAnalyzing(true);
    
    try {
      // Convert image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const base64Image = base64Data.split(',')[1];
        
        try {
          // Call AI API for food recognition
          const aiResponse = await fetch('https://toolkit.rork.com/text/llm/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [
                {
                  role: 'system',
                  content: 'You are a highly accurate nutrition expert AI specializing in food recognition and portion estimation. Analyze food images with precision and provide detailed nutritional information. If multiple food items are visible, focus on the main/largest item. Return a JSON object with: name (descriptive food name), estimatedWeight (in grams, be precise with portion size), calories, protein, carbs, fat, fiber, sugar, sodium. Consider cooking methods, ingredients, and realistic portion sizes. Be conservative with estimates rather than overestimating.'
                },
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: 'Analyze this food image carefully. Identify the main food item and estimate its nutritional content based on the visible portion size. Consider the cooking method, ingredients, and realistic serving size. Provide accurate nutritional data in JSON format.'
                    },
                    {
                      type: 'image',
                      image: base64Image
                    }
                  ]
                }
              ]
            }),
          });
          
          const aiResult = await aiResponse.json();
          
          // Parse AI response
          let foodData;
          try {
            foodData = JSON.parse(aiResult.completion);
          } catch {
            // Fallback if AI doesn't return valid JSON
            Alert.alert(
              'Recognition Failed',
              'Unable to identify the food item. Please try taking another photo or add the food manually.',
              [{ text: 'OK' }]
            );
            return;
          }
          
          // Create food item
          const newFoodItem: Omit<FoodItem, 'id'> = {
            name: foodData.name || 'AI Scanned Food',
            brand: 'AI Detected',
            servingSize: foodData.estimatedWeight || 100,
            servingUnit: 'g',
            calories: foodData.calories || 200,
            protein: foodData.protein || 10,
            carbs: foodData.carbs || 20,
            fat: foodData.fat || 8,
            fiber: foodData.fiber || 3,
            sugar: foodData.sugar || 5,
            sodium: foodData.sodium || 300,
          };
          
          const addedFoodItem = addFoodItem(newFoodItem);
          
          // Add to meal if mealType is specified
          if (mealType) {
            const today = new Date().toISOString().split('T')[0];
            addMealEntry({
              foodItem: addedFoodItem,
              servings: 1,
              mealType: mealType as MealEntry['mealType'],
              date: today,
            });
          }
          
          // Navigate to food details screen for review and editing
          router.push({
            pathname: '/food-recognition-results',
            params: {
              foodData: JSON.stringify({
                ...addedFoodItem,
                imageUri: imageUri,
                mealType: mealType || 'snack'
              })
            }
          });
          
        } catch (error) {
          console.error('AI analysis error:', error);
          Alert.alert(
            'Analysis Failed',
            'Unable to analyze the food image. Please try again or add manually.',
            [{ text: 'OK' }]
          );
        }
      };
      
      reader.readAsDataURL(blob);
      
    } catch (error) {
      console.error('Image processing error:', error);
      Alert.alert('Error', 'Failed to process image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const takePicture = async () => {
    if (!cameraRef.current) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      
      if (photo?.uri) {
        await analyzeFood(photo.uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take picture. Please try again.');
    }
  };
  
  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets[0]) {
      await analyzeFood(result.assets[0].uri);
    }
  };
  
  return (
    <View style={styles.container}>
      {Platform.OS !== 'web' ? (
        <CameraView 
          ref={cameraRef}
          style={styles.camera} 
          facing={facing}
        >
          <View style={styles.overlay}>
            <View style={styles.topControls}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => router.back()}
                testID="close-camera"
              >
                <X size={24} color={colors.white} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.flipButton}
                onPress={toggleCameraFacing}
                testID="flip-camera"
              >
                <FlipHorizontal size={24} color={colors.white} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.scanFrame}>
              <View style={styles.corner} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            
            <View style={styles.instructions}>
              <Sparkles size={20} color={colors.white} />
              <Text style={styles.instructionText}>
                Position your food within the frame for AI analysis
              </Text>
            </View>
            
            <View style={styles.bottomControls}>
              <TouchableOpacity 
                style={styles.galleryButton}
                onPress={pickFromGallery}
                testID="gallery-button"
              >
                <Text style={styles.galleryButtonText}>Gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.captureButton}
                onPress={takePicture}
                disabled={isAnalyzing}
                testID="capture-button"
              >
                {isAnalyzing ? (
                  <ActivityIndicator size="large" color={colors.white} />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>
              
              <View style={styles.placeholder} />
            </View>
          </View>
        </CameraView>
      ) : (
        <View style={styles.webFallback}>
          <Camera size={64} color={colors.primary} />
          <Text style={styles.webFallbackTitle}>Camera Not Available</Text>
          <Text style={styles.webFallbackMessage}>
            Camera scanning is not available on web. Use the gallery option instead.
          </Text>
          <TouchableOpacity 
            style={styles.galleryButton}
            onPress={pickFromGallery}
            testID="web-gallery-button"
          >
            <Text style={styles.galleryButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  permissionMessage: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  permissionButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    position: 'absolute',
    top: '30%',
    left: '10%',
    right: '10%',
    height: 200,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: colors.white,
    borderWidth: 3,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  instructions: {
    position: 'absolute',
    bottom: 200,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    padding: 12,
  },
  instructionText: {
    color: colors.white,
    fontSize: 14,
    marginLeft: 8,
    textAlign: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  galleryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  galleryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary,
  },
  placeholder: {
    width: 60,
  },
  webFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.background,
  },
  webFallbackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  webFallbackMessage: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
});