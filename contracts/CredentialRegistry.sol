// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DIDRegistry.sol";

/**
 * @title CredentialRegistry
 * @notice Manages issuance, storage, verification, and revocation of
 *         attendance credentials. Only credential hashes and status are
 *         stored on-chain; full credential data lives on IPFS.
 * @author Mohan Kummarigunta
 */
contract CredentialRegistry {
    enum Status { Active, Revoked }

    struct Session {
        uint256 id;
        address issuer;
        string title;
        string description;
        string date;
        uint256 createdAt;
    }

    struct Credential {
        uint256 id;
        uint256 sessionId;
        address issuer;
        address holder;
        bytes32 credentialHash;
        string ipfsURI;
        Status status;
        uint256 issuedAt;
    }

    DIDRegistry public didRegistry;

    uint256 private nextCredentialId;
    uint256 private nextSessionId;

    // sessionId => Session
    mapping(uint256 => Session) private sessions;

    // credentialId => Credential
    mapping(uint256 => Credential) private credentials;

    // holder address => array of credential IDs
    mapping(address => uint256[]) private holderCredentials;

    // sessionId => array of credential IDs issued for that session
    mapping(uint256 => uint256[]) private sessionCredentials;

    event SessionCreated(
        uint256 indexed sessionId,
        address indexed issuer,
        string title
    );

    event CredentialIssued(
        uint256 indexed credentialId,
        uint256 indexed sessionId,
        address indexed issuer,
        address holder,
        bytes32 credentialHash,
        string ipfsURI
    );

    event CredentialRevoked(uint256 indexed credentialId, address indexed issuer);

    modifier onlyIssuer() {
        require(
            didRegistry.getRole(msg.sender) == DIDRegistry.Role.Issuer,
            "Only issuers can perform this action"
        );
        _;
    }

    /**
     * @param _didRegistry Address of the deployed DIDRegistry contract
     */
    constructor(address _didRegistry) {
        didRegistry = DIDRegistry(_didRegistry);
        nextCredentialId = 1;
        nextSessionId = 1;
    }

    /**
     * @notice Create a new session (lecture, workshop, event)
     * @param _title The title of the session
     * @param _description A description of the session
     * @param _date The date of the session (e.g. "2026-03-23")
     * @return sessionId The ID of the newly created session
     */
    function createSession(
        string calldata _title,
        string calldata _description,
        string calldata _date
    ) external onlyIssuer returns (uint256) {
        require(bytes(_title).length > 0, "Session title cannot be empty");
        require(bytes(_date).length > 0, "Session date cannot be empty");

        uint256 sessionId = nextSessionId;
        nextSessionId++;

        sessions[sessionId] = Session({
            id: sessionId,
            issuer: msg.sender,
            title: _title,
            description: _description,
            date: _date,
            createdAt: block.timestamp
        });

        emit SessionCreated(sessionId, msg.sender, _title);

        return sessionId;
    }

    /**
     * @notice Get session details by ID
     * @param _sessionId The ID of the session
     */
    function getSession(uint256 _sessionId)
        external
        view
        returns (
            uint256 id,
            address issuer,
            string memory title,
            string memory description,
            string memory date,
            uint256 createdAt
        )
    {
        Session storage s = sessions[_sessionId];
        require(s.id != 0, "Session does not exist");

        return (s.id, s.issuer, s.title, s.description, s.date, s.createdAt);
    }

    /**
     * @notice Get all credential IDs issued for a session
     * @param _sessionId The ID of the session
     * @return An array of credential IDs
     */
    function getCredentialsBySession(uint256 _sessionId)
        external
        view
        returns (uint256[] memory)
    {
        require(sessions[_sessionId].id != 0, "Session does not exist");
        return sessionCredentials[_sessionId];
    }

    /**
     * @notice Issue a new attendance credential to a holder
     * @param _holder The address of the credential holder
     * @param _sessionId The ID of the session this credential is for
     * @param _credentialHash The keccak256 hash of the full credential JSON
     * @param _ipfsURI The IPFS URI where the full credential JSON is stored
     * @return credentialId The ID of the newly issued credential
     */
    function issueCredential(
        address _holder,
        uint256 _sessionId,
        bytes32 _credentialHash,
        string calldata _ipfsURI
    ) external onlyIssuer returns (uint256) {
        require(didRegistry.isRegistered(_holder), "Holder is not registered");
        require(sessions[_sessionId].id != 0, "Session does not exist");
        require(_credentialHash != bytes32(0), "Credential hash cannot be empty");
        require(bytes(_ipfsURI).length > 0, "IPFS URI cannot be empty");

        uint256 credentialId = nextCredentialId;
        nextCredentialId++;

        credentials[credentialId] = Credential({
            id: credentialId,
            sessionId: _sessionId,
            issuer: msg.sender,
            holder: _holder,
            credentialHash: _credentialHash,
            ipfsURI: _ipfsURI,
            status: Status.Active,
            issuedAt: block.timestamp
        });

        holderCredentials[_holder].push(credentialId);
        sessionCredentials[_sessionId].push(credentialId);

        emit CredentialIssued(credentialId, _sessionId, msg.sender, _holder, _credentialHash, _ipfsURI);

        return credentialId;
    }

    /**
     * @notice Revoke a credential (only the original issuer can revoke).
     *         Changes on-chain status from Active to Revoked.
     *         Off-chain IPFS data remains unchanged since IPFS is immutable.
     * @param _credentialId The ID of the credential to revoke
     */
    function revokeCredential(uint256 _credentialId) external {
        Credential storage cred = credentials[_credentialId];
        require(cred.id != 0, "Credential does not exist");
        require(cred.issuer == msg.sender, "Only the original issuer can revoke");
        require(cred.status == Status.Active, "Credential is already revoked");

        cred.status = Status.Revoked;

        emit CredentialRevoked(_credentialId, msg.sender);
    }

    /**
     * @notice Verify a credential by comparing its hash (anyone can call)
     * @param _credentialId The ID of the credential to verify
     * @param _credentialHash The hash to compare against the stored hash
     * @return valid True if the hash matches and the credential status is Active
     */
    function verifyCredential(
        uint256 _credentialId,
        bytes32 _credentialHash
    ) external view returns (bool valid) {
        Credential storage cred = credentials[_credentialId];
        require(cred.id != 0, "Credential does not exist");

        return (cred.credentialHash == _credentialHash && cred.status == Status.Active);
    }

    /**
     * @notice Get credential metadata by ID (anyone can call)
     * @param _credentialId The ID of the credential
     */
    function getCredential(uint256 _credentialId)
        external
        view
        returns (
            uint256 id,
            uint256 sessionId,
            address issuer,
            address holder,
            bytes32 credentialHash,
            string memory ipfsURI,
            Status status,
            uint256 issuedAt
        )
    {
        Credential storage cred = credentials[_credentialId];
        require(cred.id != 0, "Credential does not exist");

        return (
            cred.id,
            cred.sessionId,
            cred.issuer,
            cred.holder,
            cred.credentialHash,
            cred.ipfsURI,
            cred.status,
            cred.issuedAt
        );
    }

    /**
     * @notice Get all credential IDs for a holder
     * @param _holder The address of the holder
     * @return An array of credential IDs
     */
    function getCredentialsByHolder(address _holder)
        external
        view
        returns (uint256[] memory)
    {
        return holderCredentials[_holder];
    }
}
