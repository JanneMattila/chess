﻿using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using MyChess.Data;
using MyChess.Interfaces;

namespace MyChess.Handlers
{
    public class GamesHandler : BaseHandler
    {
        private readonly Compactor _compactor = new Compactor();

        public GamesHandler(ILogger log, IMyChessDataContext context)
            : base(log, context)
        {
        }

        public async Task<List<MyChessGame>> GetGamesAsync(AuthenticatedUser authenticatedUser)
        {
            var userID = await GetOrCreateUserAsync(authenticatedUser);
            var games = new List<MyChessGame>();
            
            await foreach(var gameEntity in _context.GetAllAsync<GameEntity>(TableNames.Users, userID))
            {
                var game = _compactor.Decompress(gameEntity.Data);
                games.Add(game);
            }
            return games;
        }
    }
}
