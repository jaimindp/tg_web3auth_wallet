// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

contract TenetStrategy {
    address constant public HYP_LIDO = 0xa4F109c5586181380E6b2de216BC6F123E5eBA85;

    // --- HELPERS ---

    function addressToBytes32(address _addr) view public returns (bytes32) {
        return bytes32(uint256(uint160(_addr)));
    }
}
