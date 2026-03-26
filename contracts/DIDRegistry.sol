// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DIDRegistry
 * @notice Manages DID registration, role assignment, and DID lifecycle.
 *         Admin is the deployer and cannot be changed.
 * @author Sivasanker N P
 */
contract DIDRegistry {
    enum Role { None, Holder, Issuer, Verifier }

    struct DID {
        string identifier;
        address owner;
        Role role;
        uint256 registeredAt;
        bool active;
    }

    address public admin;

    // address => DID struct
    mapping(address => DID) private dids;

    // DID string => owner address (reverse lookup)
    mapping(string => address) private didToAddress;

    // Track whether an address has registered
    mapping(address => bool) private registered;

    uint256 private didCount;

    event DIDRegistered(address indexed owner, string didString, uint256 timestamp);
    event RoleAssigned(address indexed owner, Role role, uint256 timestamp);
    event DIDDeactivated(address indexed owner, uint256 timestamp);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
        didCount = 0;
    }

    /**
     * @notice Register a new DID for the caller.
     *         DID string is auto-generated from the caller's wallet address.
     *         Caller is assigned the Holder role by default.
     */
    function registerDID() external {
        require(!registered[msg.sender], "DID already registered");

        string memory didString = string(abi.encodePacked("did:ethr:", _toHexString(msg.sender)));

        dids[msg.sender] = DID({
            identifier: didString,
            owner: msg.sender,
            role: Role.Holder,
            registeredAt: block.timestamp,
            active: true
        });

        didToAddress[didString] = msg.sender;
        registered[msg.sender] = true;
        didCount++;

        emit DIDRegistered(msg.sender, didString, block.timestamp);
        emit RoleAssigned(msg.sender, Role.Holder, block.timestamp);
    }

    /**
     * @notice Assign a role to a registered user (admin only)
     * @param _user The address to assign the role to
     * @param _role The role to assign
     */
    function assignRole(address _user, Role _role) external onlyAdmin {
        require(registered[_user], "User is not registered");
        require(dids[_user].active, "DID is deactivated");

        dids[_user].role = _role;

        emit RoleAssigned(_user, _role, block.timestamp);
    }

    /**
     * @notice Deactivate a DID (admin only)
     * @param _user The address whose DID to deactivate
     */
    function deactivateDID(address _user) external onlyAdmin {
        require(registered[_user], "User is not registered");
        require(dids[_user].active, "DID is already deactivated");

        dids[_user].active = false;

        emit DIDDeactivated(_user, block.timestamp);
    }

    /**
     * @notice Get the DID string for an address
     */
    function getDID(address _user) external view returns (string memory) {
        return dids[_user].identifier;
    }

    /**
     * @notice Check if an address is registered
     */
    function isRegistered(address _user) external view returns (bool) {
        return registered[_user];
    }

    /**
     * @notice Get the role for an address
     */
    function getRole(address _user) external view returns (Role) {
        return dids[_user].role;
    }

    /**
     * @notice Check if a DID is active
     */
    function isActive(address _user) external view returns (bool) {
        return dids[_user].active;
    }

    /**
     * @dev Converts an address to its 0x-prefixed lowercase hex string.
     */
    function _toHexString(address _addr) internal pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes20 addrBytes = bytes20(_addr);
        bytes memory result = new bytes(42);

        result[0] = "0";
        result[1] = "x";

        for (uint256 i = 0; i < 20; i++) {
            result[2 + i * 2]     = alphabet[uint8(addrBytes[i] >> 4)];
            result[2 + i * 2 + 1] = alphabet[uint8(addrBytes[i] & 0x0f)];
        }

        return string(result);
    }
}
