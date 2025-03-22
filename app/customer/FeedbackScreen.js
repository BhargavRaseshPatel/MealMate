import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { databases } from '../../services/appwrite';
import { ID } from 'appwrite';

export default function FeedbackScreen({ route, navigation }) {
  const { orderId } = route.params;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRatingPress = (value) => {
    setRating(value);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Error', 'Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      await databases.createDocument(
        'MealMate',
        'Feedback',
        ID.unique(),
        {
          order_id: orderId,
          rating: rating,
          comment: comment,
          created_at: new Date().toISOString(),
        }
      );

      Alert.alert(
        'Success',
        'Thank you for your feedback!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return [1, 2, 3, 4, 5].map((star) => (
      <TouchableOpacity
        key={star}
        onPress={() => handleRatingPress(star)}
        style={styles.starButton}
      >
        <Ionicons
          name={star <= rating ? 'star' : 'star-outline'}
          size={32}
          color="#FFD700"
        />
      </TouchableOpacity>
    ));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Order Feedback</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingTitle}>Rate your experience</Text>
          <View style={styles.starsContainer}>
            {renderStars()}
          </View>
          <Text style={styles.ratingText}>
            {rating === 0 ? 'Select a rating' : `${rating} out of 5 stars`}
          </Text>
        </View>

        <View style={styles.commentContainer}>
          <Text style={styles.commentTitle}>Your feedback (optional)</Text>
          <TextInput
            style={styles.commentInput}
            multiline
            numberOfLines={4}
            placeholder="Tell us about your experience..."
            value={comment}
            onChangeText={setComment}
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <Text style={styles.submitButtonText}>Submitting...</Text>
          ) : (
            <Text style={styles.submitButtonText}>Submit Feedback</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  starButton: {
    padding: 5,
  },
  ratingText: {
    fontSize: 16,
    color: '#666',
  },
  commentContainer: {
    marginBottom: 30,
  },
  commentTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 