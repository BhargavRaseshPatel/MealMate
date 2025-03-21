import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

const Button = ({
  title,
  onPress,
  type = 'primary',
  loading = false,
  disabled = false,
}) => {
  const buttonStyles = {
    primary: {
      container: styles.primaryContainer,
      text: styles.primaryText,
    },
    secondary: {
      container: styles.secondaryContainer,
      text: styles.secondaryText,
    },
  };

  const selectedStyle = buttonStyles[type] || buttonStyles.primary;

  return (
    <TouchableOpacity
      style={[styles.button, selectedStyle.container, disabled && styles.disabledButton]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={type === 'primary' ? '#fff' : '#FF6B6B'} size="small" />
      ) : (
        <Text style={[styles.text, selectedStyle.text]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginVertical: 10,
  },
  primaryContainer: {
    backgroundColor: '#FF6B6B',
  },
  secondaryContainer: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#FF6B6B',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default Button; 