pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./Votation.sol";



contract VotingFactory is Initializable, UUPSUpgradeable, OwnableUpgradeable {
    address verifier;
    address hasher;

    uint256 id;

    mapping(address => address[]) register;
    mapping(uint256 => address) identification; //Mapa de id a address

    function initialize(address _verifier, address _hasher) public initializer {
        id = 1;
        verifier = _verifier;
        hasher = _hasher;

        __Ownable_init();
    }

    ///@dev required by the OZ UUPS module
   function _authorizeUpgrade(address) internal override onlyOwner {}

    function createVotation(
        string memory _name,
        string memory _description,
        string[] memory _choices,
        address[] memory _whitelist,
        uint256 _startDate,
        uint256 _endDate
        ) public returns(uint, address){
        require( bytes(_name).length > 0 && bytes(_name).length < 20, "Name required!!");
         require(bytes(_description).length < 200 && bytes(_description).length > 40, "40-200 character!");
        require(_choices.length > 1, "choice error");
        require(_whitelist.length > 2, "whitelist error");

        Votation myVotation = new Votation(
            id,
            _name,
            _description,
            _choices,
            _whitelist,
            _startDate,
            _endDate,
            msg.sender,
            verifier,
            IHasher(hasher)
            
        );
        register[msg.sender].push(address(myVotation));
        identification[id] = (address(myVotation));
        uint _id = id++;

        return (_id, address(myVotation));
    }

    function getVotation(uint256 _id) external view returns (address) {
        return identification[_id];
    }

    function getRegister(address _address) external view returns (address[] memory) {
        return register[_address];
    }

}
