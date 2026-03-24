// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DIDRegistry
 * @notice Stub contract for DID registration and role management.
 *         This provides the minimum needed for CredentialRegistry to check roles.
 *         Vibha's team will expand this with full DID lifecycle logic.
 */
contract DIDRegistry {
    enum Role { None, Holder, Issuer, Verifier }

    address public admin;

    // Mapping from address to their DID string
    mapping(address => string) private dids;

    // Mapping from address to their role
    mapping(address => Role) private roles;

    // Track whether an address has registered
    mapping(address => bool) private registered;

    event DIDRegistered(address indexed user, string did);
    event RoleAssigned(address indexed user, Role role);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    /**
     * @notice Register a new DID for the caller
     * @param _did The DID string to associate with the caller's address
     */
    function registerDID(string calldata _did) external {
        require(!registered[msg.sender], "DID already registered");
        require(bytes(_did).length > 0, "DID cannot be empty");

        dids[msg.sender] = _did;
        registered[msg.sender] = true;
        roles[msg.sender] = Role.Holder; // Default role

        emit DIDRegistered(msg.sender, _did);
        emit RoleAssigned(msg.sender, Role.Holder);
    }

    /**
     * @notice Assign a role to a registered user (admin only)
     * @param _user The address to assign the role to
     * @param _role The role to assign
     */
    function setRole(address _user, Role _role) external onlyAdmin {
        require(registered[_user], "User not registered");
        roles[_user] = _role;
        emit RoleAssigned(_user, _role);
    }

    /**
     * @notice Get the DID for an address
     */
    function getDID(address _user) external view returns (string memory) {
        return dids[_user];
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
        return roles[_user];
    }
}
