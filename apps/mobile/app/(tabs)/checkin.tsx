import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Camera, CameraView, BarcodeScanningResult } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../src/api/client';

type ScanState = 'scanning' | 'loading' | 'success' | 'error';

interface CheckinResult {
  success: boolean;
  className: string;
  checkedInAt: string;
}

export default function CheckinScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanState, setScanState] = useState<ScanState>('scanning');
  const [message, setMessage] = useState('');
  const [className, setClassName] = useState('');
  const resetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();

    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const resetScanner = () => {
    setScanState('scanning');
    setMessage('');
    setClassName('');
  };

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    if (scanState !== 'scanning') return;

    // Only handle flowmat QR codes
    if (!data.startsWith('flowmat://checkin?token=')) return;

    const token = data.replace('flowmat://checkin?token=', '');
    if (!token) return;

    setScanState('loading');

    try {
      const response = await apiClient.post<CheckinResult>('/api/v1/attendance/qr-checkin', {
        token,
      });

      setClassName(response.data.className);
      setScanState('success');

      resetTimerRef.current = setTimeout(resetScanner, 2000);
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.message || err?.message || 'Check-in failed. Please try again.';
      setMessage(errorMsg);
      setScanState('error');

      resetTimerRef.current = setTimeout(resetScanner, 2000);
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#e94560" />
        <Text style={styles.subtitle}>Requesting camera permission…</Text>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Camera Permission Required</Text>
        <Text style={styles.subtitle}>
          Please grant camera access to use QR check-in.
        </Text>
        <Pressable
          style={styles.retryButton}
          onPress={async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === 'granted');
          }}
        >
          <Text style={styles.retryButtonText}>Grant Permission</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Scan QR Code</Text>
        <Text style={styles.subtitle}>Point your camera at the class QR code</Text>
      </View>

      {/* Camera */}
      <View style={styles.cameraContainer}>
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanState === 'scanning' ? handleBarCodeScanned : undefined}
        />

        {/* Reticle overlay */}
        <View style={styles.overlay}>
          <View style={styles.reticle}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
        </View>

        {/* Loading overlay */}
        {scanState === 'loading' && (
          <View style={styles.feedbackOverlay}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.feedbackText}>Checking in…</Text>
          </View>
        )}

        {/* Success overlay */}
        {scanState === 'success' && (
          <View style={[styles.feedbackOverlay, styles.successOverlay]}>
            <Text style={styles.feedbackIcon}>✓</Text>
            <Text style={styles.feedbackText}>Checked in to {className}!</Text>
          </View>
        )}

        {/* Error overlay */}
        {scanState === 'error' && (
          <View style={[styles.feedbackOverlay, styles.errorOverlay]}>
            <Text style={styles.feedbackIcon}>✗</Text>
            <Text style={styles.feedbackText}>{message}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const RETICLE_SIZE = 240;
const CORNER_SIZE = 24;
const CORNER_THICKNESS = 4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 16,
    margin: 16,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  reticle: {
    width: RETICLE_SIZE,
    height: RETICLE_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: '#ffffff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  feedbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    gap: 12,
  },
  successOverlay: {
    backgroundColor: 'rgba(34,197,94,0.75)',
  },
  errorOverlay: {
    backgroundColor: 'rgba(239,68,68,0.75)',
  },
  feedbackIcon: {
    fontSize: 56,
    color: '#ffffff',
    fontWeight: '700',
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#e94560',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});
