import React from 'react'
import { TextInput, View, Text, StyleSheet } from 'react-native'
import { COLORS, SPACING, BORDER_RADIUS } from '../constants'

const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  style,
  ...props
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          error && styles.inputError
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.text.light}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        {...props}
      />
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
  },
  
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontSize: 16,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background,
    minHeight: 48,
  },
  
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  
  inputError: {
    borderColor: COLORS.error,
  },
  
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
})

export default Input
