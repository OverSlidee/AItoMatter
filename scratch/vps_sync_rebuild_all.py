import paramiko
import time
import sys

# Reconfigure stdout to use utf-8 to prevent charmap errors on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

hostname = "89.116.39.133"
username = "username"
password = "Gojira15#red"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

try:
    ssh.connect(hostname, username=username, password=password)
    
    # 1. Pull latest git changes
    print("=== PULLING LATEST CHANGES ===")
    stdin, stdout, stderr = ssh.exec_command("cd /home/username/AItoMatter && git pull origin main")
    print(stdout.read().decode('utf-8'))
    print(stderr.read().decode('utf-8'))
    
    # 1b. Install dependencies
    print("=== INSTALLING DEPENDENCIES ===")
    stdin, stdout, stderr = ssh.exec_command("cd /home/username/AItoMatter && PATH=/home/username/.nvm/versions/node/v22.22.2/bin:$PATH npm install --legacy-peer-deps")
    print(stdout.read().decode('utf-8'))
    print(stderr.read().decode('utf-8'))
    
    # 1c. Rebuild the C# CEM Voxel Engine
    print("=== REBUILDING C# VOXEL ENGINE ===")
    dotnet_build_cmd = "cd /home/username/AItoMatter && PATH=/home/username/.dotnet:$PATH dotnet build cem/cem.csproj"
    stdin, stdout, stderr = ssh.exec_command(dotnet_build_cmd)
    print(stdout.read().decode('utf-8'))
    print(stderr.read().decode('utf-8'))
    
    # 2. Build the Next.js app
    print("=== REBUILDING NEXT.JS APP ===")
    build_cmd = "cd /home/username/AItoMatter && PATH=/home/username/.nvm/versions/node/v22.22.2/bin:$PATH npm run build"
    stdin, stdout, stderr = ssh.exec_command(build_cmd)
    
    # Read build output
    for line in iter(stdout.readline, ""):
        sys.stdout.write(line)
    print(stderr.read().decode('utf-8'))
    
    # 3. Restart the Next.js server in the velolabs-web tmux session
    print("\n=== RESTARATING NEXT.JS SERVER IN TMUX ===")
    ssh.exec_command("tmux send-keys -t velolabs-web C-c")
    time.sleep(2) # wait for process to terminate
    start_cmd = "PATH=/home/username/.nvm/versions/node/v22.22.2/bin:$PATH npm run start"
    ssh.exec_command(f"tmux send-keys -t velolabs-web '{start_cmd}' C-m")
    print("Restart command sent to velolabs-web.")
    
    # 4. Restart the SQLite worker in the velolabs-worker tmux session
    print("\n=== RESTARATING WORKER IN TMUX ===")
    ssh.exec_command("tmux send-keys -t velolabs-worker C-c")
    time.sleep(2) # wait for process to terminate
    worker_cmd = "PATH=/home/username/.nvm/versions/node/v22.22.2/bin:$PATH npm run worker"
    ssh.exec_command(f"tmux send-keys -t velolabs-worker '{worker_cmd}' C-m")
    print("Restart command sent to velolabs-worker.")
    
    # 5. Verify that both are running
    time.sleep(5)
    print("\n=== VERIFYING LISTENERS ===")
    stdin, stdout, stderr = ssh.exec_command("ss -tulpn | grep :3000")
    print("Port 3000 listeners:")
    print(stdout.read().decode('utf-8'))
    
    print("Active node processes:")
    stdin, stdout, stderr = ssh.exec_command("ps aux | grep node")
    print(stdout.read().decode('utf-8'))
    
except Exception as e:
    print(f"Error: {e}")
finally:
    ssh.close()
