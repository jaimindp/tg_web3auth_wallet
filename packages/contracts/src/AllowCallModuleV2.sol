// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.19;

import {BasePluginWithEventMetadata, PluginMetadata} from "./Base.sol";
import {ISafe} from "safe-core-protocol/contracts/interfaces/Accounts.sol";
import {ISafeProtocolManager} from "safe-core-protocol/contracts/interfaces/Manager.sol";
import {SafeTransaction, SafeProtocolAction} from "safe-core-protocol/contracts/DataTypes.sol";

contract Enum {
    enum Operation {
        Call,
        DelegateCall
    }
}

contract AllowCallModuleV2 is BasePluginWithEventMetadata {
    string public constant NAME = "Allow Call Module V2";
    string public constant VERSION = "0.2.0";

    event AddDelegate(address indexed safe, address delegate, address[] newAllowedContracts);
    event AddContracts(address indexed safe, address delegate, address[] newAllowedContracts);
    event RemoveContracts(address indexed safe, address delegate, address[] removedContracts);
    event RemoveDelegate(address indexed safe, address delegate);

    error CallFailure(bytes data);

    // Safe -> Delegate -> Contract Address the delegate can call -> true/false flag
    mapping(address => mapping (address => mapping (address => bool))) public allowedContracts;
    mapping(address => mapping (address => bool)) public delegates;

    constructor()
    BasePluginWithEventMetadata(
    PluginMetadata({
        name: "Allow Call Module V2 Plugin",
        version: "1.0.0",
        requiresRootAccess: false,
        iconUrl: "",
        appUrl: "https://5afe.github.io/safe-core-protocol-demo/#/relay/${plugin}"
    })
    )
    {
    }

    // ---- Safe Transaction Functions ----

    function addDelegate(address delegate, address[] memory newAllowedContracts) public {
        require(!delegates[msg.sender][delegate], "Delegate already exists");

        delegates[msg.sender][delegate] = true;

        for (uint i = 0; i < newAllowedContracts.length; i++) {
            allowedContracts[msg.sender][delegate][newAllowedContracts[i]] = true;
        }

        emit AddDelegate(msg.sender, delegate, newAllowedContracts);
    }

    function removeDelegate(address delegate) public {
        require(delegates[msg.sender][delegate], "Delegate does not exist");

        delegates[msg.sender][delegate] = false;

        emit RemoveDelegate(msg.sender, delegate);
    }

    function addContracts(address delegate, address[] memory newAllowedContracts) public {
        require(delegates[msg.sender][delegate], "Delegate does not exist");

        for (uint i = 0; i < newAllowedContracts.length; i++) {
            allowedContracts[msg.sender][delegate][newAllowedContracts[i]] = true;
        }

        emit AddContracts(msg.sender, delegate, newAllowedContracts);
    }

    function removeContracts(address delegate, address[] memory removedContracts) public {
        require(delegates[msg.sender][delegate], "Delegate does not exist");

        for (uint i = 0; i < removedContracts.length; i++) {
            allowedContracts[msg.sender][delegate][removedContracts[i]] = false;
        }

        emit RemoveContracts(msg.sender, delegate, removedContracts);
    }

    // ---- Module Transaction Functions ----

    function callContract(ISafeProtocolManager manager, ISafe safe, address contractToCall, bytes calldata data) public payable {
        require(delegates[address(safe)][msg.sender], "Delegate does not exist");

        require(allowedContracts[address(safe)][msg.sender][contractToCall], "Contract address not allowed");

        uint256 nonce = uint256(keccak256(abi.encode(this, manager, safe, data)));

        SafeProtocolAction[] memory actions = new SafeProtocolAction[](1);
        actions[0].to = payable(contractToCall);
        actions[0].value = msg.value;
        actions[0].data = data;

        SafeTransaction memory safeTx = SafeTransaction({actions: actions, nonce: nonce, metadataHash: bytes32(0)});
        try manager.executeTransaction(safe, safeTx) returns (bytes[] memory) {} catch (bytes memory reason) {
            revert CallFailure(reason);
        }
    }

    // spender = contract address
    function approveTokensToContract(ISafeProtocolManager manager, ISafe safe, address token, address spender, uint256 amount) public {
        require(delegates[address(safe)][msg.sender], "Delegate does not exist");

        require(allowedContracts[address(safe)][msg.sender][spender], "Contract address not allowed");

        uint256 nonce = uint256(keccak256(abi.encode(this, manager, safe, abi.encode(token, spender, amount))));

        SafeProtocolAction[] memory actions = new SafeProtocolAction[](1);
        actions[0].to = payable(token);
        actions[0].value = 0;
        actions[0].data = abi.encodeWithSignature("approve(address,uint256)", spender, amount);

        SafeTransaction memory safeTx = SafeTransaction({actions: actions, nonce: nonce, metadataHash: bytes32(0)});
        try manager.executeTransaction(safe, safeTx) returns (bytes[] memory) {} catch (bytes memory reason) {
            revert CallFailure(reason);
        }
    }
}
