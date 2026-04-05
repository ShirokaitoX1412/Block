// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FarmContract {

    struct Cow {
        string cowId;
        string breed;
        uint256 birthDate;
        string healthStatus;
        bool isActive;
    }

    struct MilkBatch {
        string batchId;
        string cowId;
        uint256 harvestDate;
        uint256 quantity;
        uint256 fatContent;
        string quality;
        bool sentToFactory;
        address recordedBy;
    }

    mapping(string => Cow) public cows;
    mapping(string => MilkBatch) public milkBatches;
    string[] public allBatchIds;
    address public owner;

    event CowRegistered(string cowId, string breed, uint256 timestamp);
    event MilkHarvested(string batchId, string cowId, uint256 quantity, uint256 timestamp);
    event BatchSentToFactory(string batchId, uint256 timestamp);

    constructor() {
        owner = msg.sender;
    }

    function registerCow(
        string memory _cowId,
        string memory _breed,
        uint256 _birthDate
    ) public {
        require(bytes(cows[_cowId].cowId).length == 0, "Bo da ton tai");
        cows[_cowId] = Cow({
            cowId: _cowId,
            breed: _breed,
            birthDate: _birthDate,
            healthStatus: "healthy",
            isActive: true
        });
        emit CowRegistered(_cowId, _breed, block.timestamp);
    }

    function recordMilkHarvest(
        string memory _batchId,
        string memory _cowId,
        uint256 _quantity,
        uint256 _fatContent,
        string memory _quality
    ) public {
        require(cows[_cowId].isActive, "Bo khong hop le");
        require(bytes(milkBatches[_batchId].batchId).length == 0, "Batch da ton tai");
        milkBatches[_batchId] = MilkBatch({
            batchId: _batchId,
            cowId: _cowId,
            harvestDate: block.timestamp,
            quantity: _quantity,
            fatContent: _fatContent,
            quality: _quality,
            sentToFactory: false,
            recordedBy: msg.sender
        });
        allBatchIds.push(_batchId);
        emit MilkHarvested(_batchId, _cowId, _quantity, block.timestamp);
    }

    function sendToFactory(string memory _batchId) public {
        require(bytes(milkBatches[_batchId].batchId).length > 0, "Batch khong ton tai");
        require(!milkBatches[_batchId].sentToFactory, "Da chuyen roi");
        milkBatches[_batchId].sentToFactory = true;
        emit BatchSentToFactory(_batchId, block.timestamp);
    }

    function getCow(string memory _cowId) public view returns (Cow memory) {
        return cows[_cowId];
    }

    function getMilkBatch(string memory _batchId) public view returns (MilkBatch memory) {
        return milkBatches[_batchId];
    }

    function getAllBatchIds() public view returns (string[] memory) {
        return allBatchIds;
    }
}