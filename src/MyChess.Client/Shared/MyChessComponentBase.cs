﻿using System.Diagnostics.CodeAnalysis;
using Microsoft.AspNetCore.Components;
using Microsoft.JSInterop;

namespace MyChess.Client.Shared
{
    public abstract class MyChessComponentBase : ComponentBase, IDisposable
    {
        private bool _disposedValue;

        [AllowNull]
        [Inject]
        protected BackendClient Client { get; set; }

        [AllowNull]
        [Inject]
        protected NavigationManager NavigationManager { get; set; }

        [AllowNull]
        [Inject]
        protected IJSRuntime JS { get; set; }

        protected void NavigateToLogin()
        {
            NavigationManager.NavigateTo($"authentication/login?returnUrl={Uri.EscapeDataString(NavigationManager.Uri)}");
        }

        protected virtual void Dispose(bool disposing)
        {
            if (!_disposedValue)
            {
                if (disposing)
                {
                    // TODO: dispose managed state (managed objects)
                }

                // TODO: free unmanaged resources (unmanaged objects) and override finalizer
                // TODO: set large fields to null
                _disposedValue = true;
            }
        }

        public void Dispose()
        {
            // Do not change this code. Put cleanup code in 'Dispose(bool disposing)' method
            Dispose(disposing: true);
            GC.SuppressFinalize(this);
        }
    }
}
