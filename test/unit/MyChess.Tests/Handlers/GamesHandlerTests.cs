﻿using System.Threading.Tasks;
using Microsoft.Extensions.Logging.Abstractions;
using MyChess.Data;
using MyChess.Handlers;
using MyChess.Interfaces;
using MyChess.Tests.Handlers.Stubs;
using Xunit;

namespace MyChess.Tests.Handlers
{
    public class GamesHandlerTests
    {
        private readonly GamesHandler _gamesHandler;
        private readonly MyChessContextStub _context;

        public GamesHandlerTests()
        {
            _context = new MyChessContextStub();
            _gamesHandler = new GamesHandler(NullLogger<GamesHandler>.Instance, _context);
        }

        [Fact]
        public async Task New_User_No_Games()
        {
            // Arrange
            var expected = 0;
            var user = new AuthenticatedUser()
            {
                Name = "abc",
                PreferredUsername = "a b",
                UserIdentifier = "u",
                ProviderIdentifier = "p"
            };

            // Act
            var actual = await _gamesHandler.GetGamesAsync(user);

            // Assert
            Assert.Equal(expected, actual.Count);
        }

        [Fact]
        public async Task Existing_User_With_Game()
        {
            // Arrange
            var expected = "123";
            var user = new AuthenticatedUser()
            {
                Name = "abc",
                PreferredUsername = "a b",
                UserIdentifier = "u",
                ProviderIdentifier = "p"
            };

            var compactor = new Compactor();
            await _context.UpsertAsync(TableNames.Users, new UserEntity()
            {
                PartitionKey = "u",
                RowKey = "p",
                UserID = "user123"
            });
            await _context.UpsertAsync(TableNames.GamesWaitingForYou, new GameEntity()
            {
                PartitionKey = "user123",
                RowKey = "123",
                Data = compactor.Compact(new MyChessGame() { ID = "123" })
            });

            // Act
            var actual = await _gamesHandler.GetGameAsync(user, "123");

            // Assert
            Assert.NotNull(actual);
            Assert.Equal(expected, actual?.ID);
        }
    }
}