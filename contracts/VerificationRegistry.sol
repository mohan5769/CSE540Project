//created by kinjal
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DIDRegistry.sol";
import "./CredentialRegistry.sol";

/**
 * @title VerificationRegistry
 * @notice Logs credential verification events on-chain for auditability.
 *         Wraps the view-only verifyCredential() to emit events.
 * @author Kinjal Chatterjee
 */
contract VerificationRegistry {

    // Reference to DIDRegistry for role and registration checks
    DIDRegistry public didRegistry;

    // Reference to CredentialRegistry for credential data
    CredentialRegistry public credentialRegistry;

    // Emitted when a credential verification is attempted
    event CredentialVerified(
        uint256 indexed credentialId,
        address indexed verifier,
        bool result,
        uint256 timestamp
    );

    // Restricts to contract admin (DIDRegistry deployer)
    modifier onlyAdmin() {
        require(
            msg.sender == didRegistry.admin(),
            "Only admin can perform this action"
        );
        _;
    }

    // Restricts to addresses with the Issuer role
    modifier onlyIssuer() {
        require(
            didRegistry.getRole(msg.sender) == DIDRegistry.Role.Issuer,
            "Only issuers can perform this action"
        );
        _;
    }

    // Restricts to addresses that have registered a DID
    modifier onlyRegistered() {
        require(
            didRegistry.isRegistered(msg.sender),
            "Caller must have a registered DID"
        );
        _;
    }

    /// @notice Sets references to DIDRegistry and CredentialRegistry
    constructor(address _didRegistry, address _credentialRegistry) {
    }

    /// @notice Verify a credential and emit a CredentialVerified event
    /// @param _credentialId The credential to verify
    /// @param _credentialHash Hash to compare against on-chain hash
    /// @return result True if hash matches and credential is Active
    function verifyAndLog(
        uint256 _credentialId,
        bytes32 _credentialHash
    ) external returns (bool result) {
    }

    /// @notice Fetch on-chain credential metadata (hash, status, IPFS URI)
    /// @param _credentialId The credential to look up
    function getCredentialStatus(uint256 _credentialId)
        external
        view
        returns (
            uint256 id,
            uint256 sessionId,
            address issuer,
            address holder,
            bytes32 credentialHash,
            string memory ipfsURI,
            CredentialRegistry.Status status,
            uint256 issuedAt
        )
    {
    }

    /// @notice Fetch all credential IDs belonging to the caller
    /// @return Array of credential IDs held by msg.sender
    function viewMyCredentials()
        external
        view
        onlyRegistered
        returns (uint256[] memory)
    {
    }
}
