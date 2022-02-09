import { createMessage, decrypt, encrypt, readMessage } from "openpgp";
import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import "./index.scss";
import { VaultContext } from "../../store";
import { decryptKey, readPrivateKey } from "openpgp";
import SelectKeyModal from "../SelectKeyModal/SelectKeyModal";
import { useLocation } from "react-router-dom";
import EditableContent from "../EditableContent/EditableContent";
import CopyIcon from "assets/icons/copy.icon.svg";

export async function readPrivateKeyFromStoredKey(
  privateKey: string,
  passphrase: string | undefined
) {
  return passphrase
    ? await decryptKey({
        privateKey: await readPrivateKey({ armoredKey: privateKey }),
        passphrase
      })
    : await readPrivateKey({ armoredKey: privateKey });
}

export default function Decrypt() {
  const vaultContext = useContext(VaultContext);
  const [showSelectKeyModal, setShowSelectKeyModal] = useState(false);
  const [showSelectedKeyDetails, setShowSelectedKeyDetails] = useState(false);
  const [error, setError] = useState<string>();
  const encryptedMessageRef = useRef<HTMLTextAreaElement>(null);
  const decryptedMessageRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useTranslation();

  const location = useLocation();

  useEffect(() => {
    const urlSearchParams = new URLSearchParams(location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    if (params.ipfsjson) {
      (async () => {
        const response = await fetch(params.ipfsjson);
        const json = await response.json();
        encryptedMessageRef.current!.value = json.message;
      })();
    }
  }, [location.search]);

  useEffect(() => {
    if (
      vaultContext.vault?.storedKeys.length === 0 ||
      !vaultContext.selectedKey === undefined
    ) {
      setShowSelectKeyModal(true);
    }
  }, [vaultContext.vault, vaultContext.selectedKey]);

  const _decrypt = useCallback(async () => {
    try {
      if (!vaultContext.selectedKey) {
        setShowSelectKeyModal(true);
        return;
      }

      const armoredMessage = encryptedMessageRef.current!.value;

      if (!armoredMessage || armoredMessage === "") {
        throw new Error(t("CommitteeTools.Decrypt.no-message-decrypt"));
      }

      const privateKey = await readPrivateKeyFromStoredKey(
        vaultContext.selectedKey.privateKey,
        vaultContext.selectedKey.passphrase
      );
      const message = await readMessage({ armoredMessage });
      const { data: decrypted } = await decrypt({
        message,
        decryptionKeys: privateKey
      });
      decryptedMessageRef.current!.value = decrypted;
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        console.log(error);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vaultContext.selectedKey]);

  const _encrypt = useCallback(async () => {
    try {
      setError("");
      if (!vaultContext.selectedKey) {
        setShowSelectKeyModal(true);
        return;
      }
      const privateKey = await readPrivateKeyFromStoredKey(
        vaultContext.selectedKey.privateKey,
        vaultContext.selectedKey.passphrase
      );
      const message = await createMessage({
        text: decryptedMessageRef.current!.value!
      });
      encryptedMessageRef.current!.value = await encrypt({
        message,
        encryptionKeys: privateKey?.toPublic()
      });
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      }
    }
  }, [vaultContext.selectedKey]);

  const SelectedKeypair = () =>
    vaultContext && (
      <div className="decrypt-wrapper__selected-key">
        <div className="box-with-copy">
          <div className="selected-key">
            <div className="selected-key__fish-eye" />
            <span>
              {vaultContext.selectedKey
                ? vaultContext.selectedKey.alias
                : t("CommitteeTools.Decrypt.no-key-selected")}
            </span>
          </div>
          {vaultContext.selectedKey && (
            <img
              alt="copy"
              src={CopyIcon}
              onClick={() => {
                setShowSelectedKeyDetails(true);
              }}
            />
          )}
        </div>
        <button
          className="open-key-list"
          onClick={() => {
            setShowSelectKeyModal(true);
          }}
        >
          {t("CommitteeTools.Decrypt.select-keypair")}
        </button>
      </div>
    );

  return (
    <div className="decrypt-wrapper">
      <SelectedKeypair />

      <div className="decrypt-wrapper__textbox-container">
        <p className="decrypt-wrapper__textbox-title">
          {t("CommitteeTools.Decrypt.encrypted-message")}
        </p>
        <EditableContent pastable ref={encryptedMessageRef} />
        {error && <p>{error}</p>}
        <button onClick={_decrypt}>
          {t("CommitteeTools.Decrypt.decrypt")}
        </button>
      </div>

      <div className="decrypt-wrapper__textbox-container">
        <p className="decrypt-wrapper__textbox-title">
          {t("CommitteeTools.Decrypt.decrypted-message")}
        </p>
        <EditableContent copyable ref={decryptedMessageRef} />
        <button onClick={_encrypt}>
          {t("CommitteeTools.Decrypt.encrypt")}
        </button>
      </div>

      {(showSelectKeyModal || showSelectedKeyDetails) && (
        <SelectKeyModal
          showKey={
            showSelectedKeyDetails ? vaultContext.selectedKey! : undefined
          }
          setShowModal={() => {
            if (showSelectedKeyDetails) setShowSelectedKeyDetails(false);
            if (showSelectKeyModal) setShowSelectKeyModal(false);
          }}
        />
      )}
    </div>
  );
}