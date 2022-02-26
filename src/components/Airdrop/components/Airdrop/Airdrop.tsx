import { hasClaimed, isRedeemed } from "actions/contractsActions";
import CloseIcon from "assets/icons/close.icon";
import classNames from "classnames";
import { EligibilityStatus } from "components/Airdrop/constants";
import Loading from "components/Shared/Loading";
import { Colors } from "constants/constants";
import { isAddress } from "ethers/lib/utils";
import { t } from "i18next";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "reducers";
import { isEthereumProvider, normalizeAddress } from "../../../../utils";
import TokenAirdrop from "../TokenAirdrop/TokenAirdrop";
import NFTAirdrop from "../NFTAirdop/NFTAirdrop";
import "./index.scss";

export default function Airdrop() {
  const [userInput, setUserInput] = useState("");
  const [pendingWalletAction, setPendingWalletAction] = useState(false);
  const nftET = useSelector((state: RootState) => state.dataReducer.airdrop?.nft);
  const tokenET = useSelector((state: RootState) => state.dataReducer.airdrop?.token);
  const [nftEligibilityStatus, setNFTEligibilityStatus] = useState(EligibilityStatus.UNKNOWN);
  const [tokenId, setTokenId] = useState<string>();
  const [tokenEligibilityStatus, setTokenEligibilityStatus] = useState(EligibilityStatus.UNKNOWN);
  const [tokenAmount, setTokenAmount] = useState<number>();

  const handleChange = useCallback(async (input: string) => {
    setUserInput(input);
    if (isAddress(input)) {
      const address = normalizeAddress(input);
      if (Object.values(nftET!).includes(address)) {
        const tokenId = Object.keys(nftET!).find(key => nftET![key] === address);
        setTokenId(tokenId!);
        if (await isRedeemed(tokenId!, address)) {
          setNFTEligibilityStatus(EligibilityStatus.REDEEMED);
        } else {
          setNFTEligibilityStatus(EligibilityStatus.ELIGIBLE);
        }
      } else {
        setNFTEligibilityStatus(EligibilityStatus.NOT_ELIGIBLE);
      }

      if (Object.keys(tokenET!).includes(address)) {
        setTokenAmount(tokenET![address]);
        if (await hasClaimed(address)) {
          setTokenEligibilityStatus(EligibilityStatus.REDEEMED);
        } else {
          setTokenEligibilityStatus(EligibilityStatus.ELIGIBLE);
        }
      } else {
        setTokenEligibilityStatus(EligibilityStatus.NOT_ELIGIBLE);
      }

    } else {
      setNFTEligibilityStatus(EligibilityStatus.UNKNOWN);
      setTokenEligibilityStatus(EligibilityStatus.UNKNOWN);
    }
  }, [nftET, tokenET]);

  useEffect(() => {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    if (params.walletAddress) {
      handleChange(params.walletAddress);
    }
  }, [handleChange])

  const renderTokenAirdrop = (tokenEligibilityStatus: EligibilityStatus) => {
    switch (tokenEligibilityStatus) {
      case EligibilityStatus.ELIGIBLE:
        return (
          <TokenAirdrop
            address={normalizeAddress(userInput)}
            tokenAmount={tokenAmount!}
            eligibleTokens={tokenET!} />);
      case EligibilityStatus.NOT_ELIGIBLE:
        return <span className="error-label">{t("Airdrop.not-eligible-token")}</span>;
      case EligibilityStatus.REDEEMED:
        return "TOKEN REDEEMED";
    }
  }

  const renderNFTAirdrop = (nftEligibilityStatus: EligibilityStatus) => {
    switch (nftEligibilityStatus) {
      case EligibilityStatus.REDEEMED:
      case EligibilityStatus.ELIGIBLE:
        return (
          <NFTAirdrop
            tokenId={tokenId!}
            eligibleTokens={nftET!}
            walletAddress={normalizeAddress(userInput)}
            eligibilityStatus={nftEligibilityStatus} />);
      case EligibilityStatus.NOT_ELIGIBLE:
        return <span className="error-label">{t("Airdrop.not-eligible-nft")}</span>;
    }
  }

  return (
    <div className={classNames({ "content": true, "airdrop-wrapper": true, "disabled": pendingWalletAction || !nftET || !tokenET })}>
      {isEthereumProvider() ? (
        <div className="search-wrapper">
          <span>{t("Airdrop.enter-address")}</span>
          <div className={classNames({ "input-container": true, "input-error": userInput !== "" && !isAddress(userInput) })}>
            <input className="address-input" type="text" value={userInput} placeholder={t("Airdrop.search-placeholder")} onChange={(e) => handleChange(e.target.value)} />
            <button className="clear-input" onClick={() => handleChange("")}><CloseIcon width="10" height="10" fill={Colors.gray} /></button>
          </div>
          {userInput !== "" && !isAddress(userInput) && <span className="error-label">{t("Airdrop.search-error")}</span>}

          {renderTokenAirdrop(tokenEligibilityStatus)}
          {renderNFTAirdrop(nftEligibilityStatus)}

          {(pendingWalletAction || !nftET || !tokenET) && <Loading />}
        </div>

      ) : <span>{t("Shared.no-ethereum")}</span>}
    </div>
  )
}
