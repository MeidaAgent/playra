const PYRA_CONTRACT_ADDRESS = "0x0d32e7e23e90e7504e1ae48acb215778571db377";

const contractCopyButton = document.querySelector("[data-pyra-contract-copy]");
const contractPendingMessage = document.querySelector(
  "[data-pyra-contract-pending]",
);
const contractCopyStatus = document.querySelector("[data-pyra-contract-status]");

if (
  PYRA_CONTRACT_ADDRESS &&
  contractCopyButton &&
  contractPendingMessage &&
  contractCopyStatus
) {
  const shortenedAddress = `${PYRA_CONTRACT_ADDRESS.slice(0, 6)}...${PYRA_CONTRACT_ADDRESS.slice(-4)}`;

  contractCopyButton.hidden = false;
  contractPendingMessage.hidden = true;
  contractCopyButton.textContent = `${shortenedAddress} · Copy`;

  contractCopyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(PYRA_CONTRACT_ADDRESS);
      contractCopyButton.textContent = `${shortenedAddress} · Copied`;
      contractCopyStatus.textContent = "Copied!";
    } catch (error) {
      console.error("Unable to copy the PYRA contract address.", error);
      contractCopyStatus.textContent = "Copy failed. Please try again.";
    }
  });
}
