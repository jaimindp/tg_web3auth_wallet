// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/AllowCallModuleV2.sol";

contract AllowCallModuleV2Test is Test {
    AllowCallModuleV2 public module;
    address public delegateAddressA = address(0x1);
    address public delegateAddressB = address(0x2);
    address public contractAddressA = address(0x3);
    address public contractAddressB = address(0x4);
    address public contractAddressC = address(0x5);

    function setUp() public {
        module = new AllowCallModuleV2();
    }

    function testAddDelegate() public {
        address[] memory contracts = new address[](2);
        contracts[0] = contractAddressA;
        contracts[1] = contractAddressB;
        module.addDelegate(delegateAddressA, contracts);
        assertTrue(module.delegates(address(this), delegateAddressA));
        assertTrue(module.allowedContracts(address(this), delegateAddressA, contractAddressA));
        assertTrue(module.allowedContracts(address(this), delegateAddressA, contractAddressB));
    }
}
