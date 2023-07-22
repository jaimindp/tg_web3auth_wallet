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

contract AllowCallModuleV is BasePluginWithEventMetadata2 {
    string public constant NAME = "Allow Call Module";
    string public constant VERSION = "0.1.0";

    event AddDelegate(address indexed safe, address delegate, address[] newAllowedContracts);
    event AddContracts(address indexed safe, address delegate, address[] newAllowedContracts);
    event RemoveContracts(address indexed safe, address delegate, address[] removedContracts);
    event RemoveDelegate(address indexed safe, address delegate);

    // Safe -> Delegate -> Contract Address the delegate can call -> true/false flag
    mapping(address => mapping (address => mapping (address => bool))) public allowedContracts;
    mapping(address => mapping (address => bool)) public delegates;

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

    function callContract(GnosisSafe safe, address contractToCall, bytes calldata data) public {
        require(delegates[address(safe)][msg.sender], "Delegate does not exist");

        require(allowedContracts[address(safe)][msg.sender][contractToCall], "Contract address not allowed");

        require(safe.execTransactionFromModule(contractToCall, msg.value, data, Enum.Operation.Call), "Could not execute the call");
    }

    // spender = contract address
    function approveTokensToContract(GnosisSafe safe, address token, address spender, uint256 amount) public {
        require(delegates[address(safe)][msg.sender], "Delegate does not exist");

        require(allowedContracts[address(safe)][msg.sender][spender], "Contract address not allowed");

        bytes memory data = abi.encodeWithSignature("approve(address,uint256)", spender, amount);
        require(safe.execTransactionFromModule(token, 0, data, Enum.Operation.Call), "Could not execute the call");
    }
}
