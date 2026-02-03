"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import type { ConnectionType } from "@/lib/types";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

interface ConnectButtonProps {
  /** The profile ID initiating the connection. */
  fromProfileId: string;
  /** The target profile ID. */
  toProfileId: string;
  /** Display name of the target (for confirmation UI). */
  toName: string;
  /** Type of connection to create. */
  connectionType: ConnectionType;
  /** Button label when not yet sent. */
  label?: string;
  /** Button label after sent. */
  sentLabel?: string;
  /** Whether to show a confirmation modal with optional note. */
  showModal?: boolean;
  /** Full-width button. */
  fullWidth?: boolean;
  /** Button size. */
  size?: "sm" | "md" | "lg";
}

/**
 * ConnectButton creates a connection (profile share) between two profiles.
 * The connection record links from_profile_id → to_profile_id. Both parties
 * can then view each other's profile — the profile IS the message.
 *
 * An optional note can be attached, but the primary interaction is the
 * profile share itself.
 */
export default function ConnectButton({
  fromProfileId,
  toProfileId,
  toName,
  connectionType,
  label = "Connect",
  sentLabel = "Connected",
  showModal: showConfirmation = true,
  fullWidth = false,
  size = "sm",
}: ConnectButtonProps) {
  const { user, openAuthModal } = useAuth();
  const [alreadySent, setAlreadySent] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Check for existing connection
  useEffect(() => {
    if (!fromProfileId || !toProfileId || !isSupabaseConfigured()) return;

    const check = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("connections")
        .select("id")
        .eq("from_profile_id", fromProfileId)
        .eq("to_profile_id", toProfileId)
        .eq("type", connectionType)
        .limit(1)
        .single();

      if (data) setAlreadySent(true);
    };

    check();
  }, [fromProfileId, toProfileId, connectionType]);

  const createConnection = useCallback(async () => {
    if (!fromProfileId || !isSupabaseConfigured()) return;

    setSubmitting(true);
    setError("");

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase
        .from("connections")
        .insert({
          from_profile_id: fromProfileId,
          to_profile_id: toProfileId,
          type: connectionType,
          status: "pending",
          message: note.trim() || null,
        });

      if (insertError) {
        if (insertError.code === "23505" ||
            insertError.message.includes("duplicate") ||
            insertError.message.includes("unique")) {
          setAlreadySent(true);
          setModalOpen(false);
          return;
        }
        throw new Error(insertError.message);
      }

      setSuccess(true);
      setAlreadySent(true);
      setTimeout(() => {
        setModalOpen(false);
        setSuccess(false);
        setNote("");
      }, 1500);
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? (err as { message: string }).message
          : String(err);
      setError(`Something went wrong: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  }, [fromProfileId, toProfileId, connectionType, note]);

  const handleClick = () => {
    if (!user) {
      openAuthModal(undefined, "sign-up");
      return;
    }
    if (alreadySent) return;

    if (showConfirmation) {
      setModalOpen(true);
    } else {
      createConnection();
    }
  };

  const actionLabel = connectionType === "invitation"
    ? "invite"
    : connectionType === "application"
    ? "apply to"
    : "connect with";

  return (
    <>
      <Button
        size={size}
        fullWidth={fullWidth}
        variant={alreadySent ? "secondary" : "primary"}
        onClick={handleClick}
        disabled={alreadySent}
      >
        {alreadySent ? sentLabel : label}
      </Button>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          if (!submitting) {
            setModalOpen(false);
            setError("");
          }
        }}
        title={success ? "Sent!" : `Share your profile with ${toName}`}
        size="md"
      >
        {success ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg text-gray-900">
              Your profile has been shared with {toName}.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-base text-gray-600">
              When you {actionLabel} <strong>{toName}</strong>, your profile will be
              shared with them. They&#39;ll be able to see your profile details
              and respond to you.
            </p>

            <div>
              <label htmlFor="connect-note" className="block text-sm font-medium text-gray-700 mb-1">
                Add a note (optional)
              </label>
              <textarea
                id="connect-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Introduce yourself or share why you're reaching out..."
                rows={3}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-base" role="alert">
                {error}
              </div>
            )}

            <Button
              fullWidth
              loading={submitting}
              onClick={createConnection}
            >
              Share Profile
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
