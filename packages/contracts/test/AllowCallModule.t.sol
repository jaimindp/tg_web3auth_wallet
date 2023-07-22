// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/AllowCallModule.sol";

contract AllowCallModuleTest is Test {
    AllowCallModule public module;
    address public delegate;
    address public contractA;
    address public contractB;
    address public contractC;

    function setUp() public {
        module = new AllowCallModule();
        delegate = address(0x12345);
        contractA = address(0x67);
        contractB = address(0x78);
        contractC = address(0x89);
    }

    function testAddDelegate() public {
        address[] memory contracts = address[](2);
//        module.addDelegate(delegate,)
    }

    function testIncrement() public {
        counter.increment();
        assertEq(counter.number(), 1);
    }

    function testSetNumber(uint256 x) public {
        counter.setNumber(x);
        assertEq(counter.number(), x);
    }
}
