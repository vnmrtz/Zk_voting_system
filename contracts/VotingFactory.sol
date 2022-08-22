pragma solidity ^0.8.9;

import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "./Voting";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VotingFactory is Ownable, UUPSUpgradeable {

    mapping(address => address[]) register;
    mapping(uint256 => address) identification; //Mapa de id a address

    function createVotation(
        uint256 _id,
        string memory _name,
        string memory _description,
        string[] memory _choices,
        address[] memory _whitelist,
        uint256 _startDate,
        uint256 _endDate,
        address _admin,
        address _verifier,
        IHasher _hasher
        ) public{

        Votation myVotation = new Votation;
        register[msg.sender].push(myVotation);
        identificador[_id].push(msg.sender);
    }

    function getVotatation(uint256 _id) public view returns (address) {
        return identification[_id];
    }

    function getRegister(address _address) public view returns (address[]) {
        return register[_address];
    }

}
