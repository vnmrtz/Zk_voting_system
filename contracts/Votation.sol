pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./MerkleTree.sol";

interface IVerifier {
    function verifyProof(bytes memory _proof, uint256[2] memory _input)
        external
        returns (bool);
}

contract Votation is Ownable, MerkleTree {
    uint32 private constant MERKLE_LEVELS = 15;
    uint256 private constant MIN_DELAY = 2 hours;
    uint256 public id;
    string public name;
    string public description;
    string[] public choices;
    uint256 public choiceNumber;

    address public verifier;

    mapping(uint256 => uint256) votes;
    mapping(bytes32 => bool) public nullifierHashes;
    mapping(bytes32 => bool) public commitments;
    mapping(address => bool) whiteList;

    uint256 public startDate;
    uint256 public endDate;

    modifier onlyWhitelist() {
        require(whiteList[msg.sender], "Not authorized");
        _;
    }

    constructor(
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
    ) MerkleTree(MERKLE_LEVELS, _hasher) {
        require(_startDate + MIN_DELAY < _endDate, "Votation time should be bigger than 2 hours!!");
        id = _id;
        name = _name;
        description = _description;
        choices = _choices;
        choiceNumber = _choices.length;
        startDate = _startDate;
        endDate = _endDate;
        verifier = _verifier;

        uint256 length = _whitelist.length;
        for (uint256 i = 0; i < length; i++) {
            whiteList[_whitelist[i]] = true;
        }

        if (_admin != address(0)) {
            transferOwnership(_admin);
        }
    }

    event SignUp(
        bytes32 indexed commitment,
        uint32 leafIndex,
        uint256 timestamp
    );
    event Vote(address voter, bytes32 nullifierHash);

    function addMember(address _user) public onlyOwner {
        whiteList[_user] = true;
    }

    function results(uint256 _choice) public view returns (uint256) {
        return votes[_choice];
    }

    function hasEnded() public view returns (bool) {
        return block.timestamp > endDate;
    }

    function hasStarted() public view returns (bool) {
        return block.timestamp > startDate;
    }

    function signUp(bytes32 _commitment)
        external
        onlyWhitelist
        returns (uint256 index)
    {
        require(
            !commitments[_commitment],
            "The commitment has been submitted!!"
        );
        require(block.timestamp < startDate, "Votation has already started!!");

        uint32 insertedIndex = _insert(_commitment);
        commitments[_commitment] = true;
        whiteList[msg.sender] = false;

        emit SignUp(_commitment, insertedIndex, block.timestamp);
        return insertedIndex;
    }

    function vote(
        bytes calldata _proof,
        bytes32 _nullifierHash,
        uint256 _choice
    ) external {
        require(
            block.timestamp < endDate && block.timestamp >= startDate,
            "Votation has not started yet"
        );
        require(_choice >= 1 && _choice <= choices.length);
        require(
            !nullifierHashes[_nullifierHash],
            "Your vote has already been submitted"
        );
        require(
            IVerifier(verifier).verifyProof(
                _proof,
                [uint256(latestRoot), uint256(_nullifierHash)]
            ),
            "Invalid withdraw proof"
        );
        votes[_choice]++;
        nullifierHashes[_nullifierHash] = true;
        emit Vote(msg.sender, _nullifierHash);
    }
}
