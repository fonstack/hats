import { useContext } from "react";
import { t } from "i18next";
import { IStoredKey } from "../../../../types/types";
import { VaultContext } from "../../store";

function DeleteKey({
  keyToDelete,
  onFinish
}: {
  keyToDelete: IStoredKey;
  onFinish: () => any;
}) {
  const vaultContext = useContext(VaultContext);

  return (
    <>
      <p className="keymodal-delete__description">
        {t("CommitteeTools.keymodal.delete-text")}
      </p>
      <div className="keymodal-delete__button-container">
        <button
          onClick={() => {
            vaultContext!.deleteKey!(keyToDelete);
            onFinish();
          }}
        >
          Yes
        </button>
        <button
          className="keymodal-delete__button-cancel"
          onClick={() => {
            onFinish();
          }}
        >
          Cancel
        </button>
      </div>
    </>
  );
}

export default DeleteKey;