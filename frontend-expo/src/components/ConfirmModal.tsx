import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { palette } from "../theme/colors";

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, destructive && styles.confirmButtonDanger]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modal: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: palette.white,
    borderRadius: 16,
    borderColor: palette.slate200,
    borderWidth: 1,
    padding: 18,
    gap: 8,
  },
  title: {
    color: palette.slate900,
    fontSize: 20,
    fontWeight: "800",
  },
  message: {
    color: palette.slate500,
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: palette.white,
  },
  cancelText: {
    color: palette.slate700,
    fontWeight: "700",
  },
  confirmButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: palette.blue,
  },
  confirmButtonDanger: {
    backgroundColor: "#DC2626",
  },
  confirmText: {
    color: palette.white,
    fontWeight: "700",
  },
});
